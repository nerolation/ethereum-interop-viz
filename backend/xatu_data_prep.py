import logging
import pyxatu
from datetime import datetime
import pytz
import pandas as pd
import os, json
import numpy as np
import time  # Added for timestamp logging
#from backend.pyxatu_config import get_pyxatu_config

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize pyxatu with environment variables (supported in version 1.8+)
# Using PyXatu v1.9 with NO_GADGET flag to ensure correct usage with environment variables
logger.info(f"Initializing PyXatu at {time.time()}")

# Check if we're running locally and need to set environment variables from ~/.pyxatu_config.json
if not os.environ.get('CLICKHOUSE_USER') and os.path.exists(os.path.expanduser('~/.pyxatu_config.json')):
    logger.info("Running locally, loading PyXatu config from ~/.pyxatu_config.json")
    try:
        with open(os.path.expanduser('~/.pyxatu_config.json'), 'r') as f:
            config = json.load(f)
            os.environ['CLICKHOUSE_USER'] = config.get('CLICKHOUSE_USER', '')
            os.environ['CLICKHOUSE_PASSWORD'] = config.get('CLICKHOUSE_PASSWORD', '')
            os.environ['CLICKHOUSE_URL'] = config.get('CLICKHOUSE_URL', '')
            logger.info(f"Loaded config: URL={os.environ['CLICKHOUSE_URL']}, User={os.environ['CLICKHOUSE_USER']}")
    except Exception as e:
        logger.error(f"Error loading PyXatu config: {e}")

xatu = pyxatu.PyXatu(use_env_variables=True, NO_GADGET=True)

def get_reorgs():
    logger.info("Fetching reorg data")
    potential_reorgs = xatu.execute_query("""
    SELECT DISTINCT
        slot-depth, meta_network_name, meta_consensus_implementation
    FROM default.beacon_api_eth_v1_events_chain_reorg
    WHERE
        event_date_time > NOW() - INTERVAL '10 MINUTE'
    """
    , columns="slot, network, client")
    print("potential_reorgs")
    print(potential_reorgs)
    if isinstance(potential_reorgs, pd.DataFrame):
        networks = ["mainnet", "sepolia", "holesky"]
        net_stats = {}
        for net in networks:
            net_reorgs = potential_reorgs[potential_reorgs["network"] == net]        
            net_client = {}
            for client in net_reorgs.client.unique():
                net_client[client] = {"reorgs": set(net_reorgs["slot"].tolist())}
                net_stats[net] = net_client
        logger.info(f"Found reorg data: {net_stats}")
        return net_stats
    else:
        logger.info("No reorg data found")
        return {}

logger.info("Getting reorg data")
reorg_dict = get_reorgs()

logger.info("Executing query for block events")
df = xatu.execute_query("""
    SELECT slot, min(event_date_time) as event_date_time, meta_network_name, meta_consensus_implementation 
    FROM beacon_api_eth_v1_events_block
    WHERE updated_date_time > NOW() - INTERVAL 10 MINUTE
    GROUP BY slot, meta_network_name, meta_consensus_implementation
    ORDER BY slot DESC
""", columns="slot, timestamp, network, client")

logger.info(f"Query returned {len(df)} rows")

grouped = df.groupby(['client', 'network'])['slot'].agg(['min', 'max']).reset_index()

df = df.merge(grouped, on=['client', 'network'], how='left', suffixes=('', '_client_network'))

df = df[df['slot'] >= df['max'] - 50]

df = df.drop(columns=['min', 'max'])

df["status"] = "produced"

def fill_missing_slots(df):
    """
    For each (network, client) group in the DataFrame, fill in missing slots (i.e. those slots 
    between the minimum and maximum slot that are not present). Rows corresponding to missing slots 
    are marked with a missing timestamp (NaT) and a status of 'missed'. For rows that already exist, 
    a default status 'produced' is assigned.
    
    Parameters:
        df (pd.DataFrame): DataFrame with columns ['slot', 'timestamp', 'network', 'client'].
        
    Returns:
        pd.DataFrame: DataFrame with continuous slot numbers for each (network, client) and a new 'status' column.
    """
    logger.info("Filling missing slots")
    dfs = []
    # Group the data by network and client
    for (network, client), group in df.groupby(['network', 'client']):
        min_slot = group['slot'].min()
        max_slot = group['slot'].max()
        logger.info(f"Network: {network}, Client: {client}, Min slot: {min_slot}, Max slot: {max_slot}")
        # Create a DataFrame with every slot between min and max (inclusive)
        full_slots = pd.DataFrame({'slot': range(min_slot, max_slot + 1)})
        full_slots['network'] = network
        full_slots['client'] = client
        # Merge the full slot range with the existing group data (left merge ensures all slots are present)
        merged = pd.merge(full_slots, group, on=['slot', 'network', 'client'], how='left')
        # Ensure the timestamp column is in datetime format
        merged['timestamp'] = pd.to_datetime(merged['timestamp'])
        # For slots with no existing row (i.e. missing timestamp), mark status as 'missed'
        # Otherwise mark as 'produced'
        merged['status'] = np.where(merged['timestamp'].isna(), 'missed', merged['status'])
        dfs.append(merged)
    result = pd.concat(dfs, ignore_index=True)
    logger.info(f"After filling missing slots: {len(result)} rows")
    return result

def update_status(df, reorg_dict):
    """
    Update the 'status' column based on the reorg dictionary. For each (network, client) pair, 
    if a row's slot is in the provided reorgs set, its status is updated to 'reorged'.
    
    Parameters:
        df (pd.DataFrame): DataFrame with a continuous slot range and a 'status' column.
        reorg_dict (dict): Dictionary structured as:
                           { network: { client: { 'reorgs': set(slots) } } }
                           
    Returns:
        pd.DataFrame: DataFrame with updated status values.
    """
    logger.info("Updating status based on reorgs")
    for network, clients in reorg_dict.items():
        for client, data in clients.items():
            reorgs = data.get('reorgs', set())
            mask = (df['network'] == network) & (df['client'] == client) & (df['slot'].isin(reorgs))
            df.loc[mask, 'status'] = 'reorged'
    return df

# Step 1: Fill in missing slots and mark them as 'missed'
df_filled = fill_missing_slots(df)

# Step 2: Update the status of rows corresponding to reorgs to 'reorged'
df_updated = update_status(df_filled, reorg_dict)

# Optionally, sort the DataFrame for clarity
df_updated = df_updated.sort_values(by=['network', 'client', 'slot']).reset_index(drop=True)

logger.info("Executing query for beacon blocks")
info = xatu.execute_query("""
    SELECT DISTINCT slot, block_root, parent_root, meta_network_name 
    FROM beacon_api_eth_v2_beacon_block
    WHERE updated_date_time > NOW() - INTERVAL 20 MINUTE
    ORDER BY slot DESC
""", columns="slot, hash, parent_hash, network")

logger.info(f"Beacon block query returned {len(info)} rows")

df = df_updated
df = pd.merge(df, info, how="left", left_on=["slot", "network"], right_on=["slot", "network"])

logger.info(f"After merging with beacon blocks: {len(df)} rows")

SLOT_0_TIMESTAMP_MS = 1606824023000  # Slot 0 timestamp in milliseconds
SLOT_DURATION_MS = 12000             # Slot duration in milliseconds

def fill_missing_timestamp(row):
    # If timestamp is not NaN, just return it
    if pd.notna(row['timestamp']):
        return row['timestamp']
    # Compute the slot start time (in ms) and add 8 seconds (8000 ms)
    new_ts_ms = SLOT_0_TIMESTAMP_MS + row['slot'] * SLOT_DURATION_MS + 8000
    # Convert to a UTC datetime string with millisecond precision.
    dt = datetime.utcfromtimestamp(new_ts_ms / 1000)
    # Format to a string matching the formats used later (e.g. 'YYYY-MM-DD HH:MM:SS.%f')
    # Then trim to 3 digits of milliseconds
    return dt.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]

# Apply the function to update the 'timestamp' column only where it's NaN.
logger.info("Filling missing timestamps")
df['timestamp'] = pd.Series(df.apply(fill_missing_timestamp, axis=1), dtype='datetime64[ns]')

def parse_datetime(event_time):
    # If the event_time is a Timestamp, no need to parse it
    if isinstance(event_time, pd.Timestamp):
        dt = event_time
    else:
        # If it's a string, parse it
        try:
            dt = datetime.strptime(event_time, '%Y-%m-%d %H:%M:%S.%f')
        except ValueError:
            dt = datetime.strptime(event_time, '%Y-%m-%d %H:%M:%S')
    
    return dt.replace(tzinfo=pytz.UTC).timestamp() * 1000  # Return in milliseconds

def get_seconds_in_slot(first_seen_ts: int, slot: int) -> float:
    slot_offset = slot * SLOT_DURATION_MS
    time_in_slot_ms = (first_seen_ts - SLOT_0_TIMESTAMP_MS - slot_offset) % SLOT_DURATION_MS
    return round(time_in_slot_ms / 1000, 3)

# Apply the function directly on the timestamp column
logger.info("Calculating timestamp seconds")
df["timestamp_seconds"] = df["timestamp"].apply(parse_datetime)
df["seconds_in_slot"] = df.apply(lambda x: get_seconds_in_slot(x["timestamp_seconds"], x["slot"]), axis=1)

logger.info("Preparing to save data to files")
try:
    known = sorted(os.listdir("data"), key=lambda x: x.split(".")[0])
    logger.info(f"Found {len(known)} existing data files")
except:
    logger.info("No existing data directory found, will create it")
    known = list()


def df_to_data(df, output_dir="data"):
    # Check if we're running on Heroku
    is_heroku = os.environ.get('DYNO') is not None
    
    # Use the correct path based on the environment
    if is_heroku:
        # On Heroku, use the absolute path
        output_dir = os.path.join("/app/backend", output_dir)
    
    logger.info(f"Saving data to {output_dir}")
    os.makedirs(output_dir, exist_ok=True)
    
    # Group by 'slot' and sort the slots once
    grouped = df.groupby('slot')
    try:
        known = sorted(os.listdir(output_dir), key=lambda x: x.split(".")[0])
        logger.info(f"Found {len(known)} existing files in {output_dir}")
    except:
        known = list()
    
    saved_slots = []
    for slot, group in grouped:
        logger.info(f"Processing slot {slot}/{df.slot.max()}")
        
        slot_data = {}
        # Get the network for the group (assuming all rows in a group have the same network)
        network = group['network'].iloc[0]  # Take the first network value in the group
        
        # Convert rows to dictionaries at once (avoiding iterrows)
        for _, row in group.iterrows():
            row_dict = row.to_dict()
            row_dict["timestamp"] = str(row_dict["timestamp"]) if pd.notna(row_dict.get("timestamp")) else None
            slot_data[row_dict['client']] = row_dict
        
        # Define the file path using the slot number and network
        network_dir = os.path.join(output_dir, network)
        os.makedirs(network_dir, exist_ok=True)
        file_path = os.path.join(network_dir, f"{slot}.json")
        
        # Write the JSON file
        with open(file_path, "w") as f:
            json.dump(slot_data, f, indent=4)
        
        logger.info(f"Saved slot {slot} for network {network} to {file_path}")
        saved_slots.append(slot)

        # Clean up old files if more than 300
        if len(known) > 50:
            try:
                old_file = os.path.join(output_dir, network, known[0])
                if os.path.exists(old_file):
                    os.remove(old_file)
                    logger.info(f"Removed old slot file: {old_file}")
                known.pop(0)  # Remove the first element after deletion to keep the list updated
            except Exception as e:
                logger.error(f"Error removing old file: {e}")
    
    logger.info(f"Saved {len(saved_slots)} slots: {saved_slots}")

logger.info("Saving data to files")
df_to_data(df)
logger.info("Data saving complete")