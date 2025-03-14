import logging
import pyxatu
from datetime import datetime
import pytz
import pandas as pd
import os, json
import numpy as np
from pyxatu_config import get_pyxatu_config

# Initialize pyxatu with configuration from environment variables or config file
config = get_pyxatu_config()
xatu = pyxatu.PyXatu(
    clickhouse_user=config.get("CLICKHOUSE_USER"),
    clickhouse_password=config.get("CLICKHOUSE_PASSWORD"),
    clickhouse_url=config.get("CLICKHOUSE_URL")
)

def get_reorgs():
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
        return net_stats
    else:
        return {}

reorg_dict = get_reorgs()

df = xatu.execute_query("""
    SELECT slot, min(event_date_time) as event_date_time, meta_network_name, meta_consensus_implementation 
    FROM beacon_api_eth_v1_events_block
    WHERE updated_date_time > NOW() - INTERVAL 10 MINUTE
    GROUP BY slot, meta_network_name, meta_consensus_implementation
    ORDER BY slot DESC
""", columns="slot, timestamp, network, client")

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
    dfs = []
    # Group the data by network and client
    for (network, client), group in df.groupby(['network', 'client']):
        min_slot = group['slot'].min()
        max_slot = group['slot'].max()
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
    return pd.concat(dfs, ignore_index=True)

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


info = xatu.execute_query("""
    SELECT DISTINCT slot, block_root, parent_root, meta_network_name 
    FROM beacon_api_eth_v2_beacon_block
    WHERE updated_date_time > NOW() - INTERVAL 20 MINUTE
    ORDER BY slot DESC
""", columns="slot, hash, parent_hash, network")


df = df_updated
df = pd.merge(df, info, how="left", left_on=["slot", "network"], right_on=["slot", "network"])



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
df['timestamp'] = df.apply(fill_missing_timestamp, axis=1)

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
df["timestamp_seconds"] = df["timestamp"].apply(parse_datetime)
df["seconds_in_slot"] = df.apply(lambda x: get_seconds_in_slot(x["timestamp_seconds"], x["slot"]), axis=1)



try:
    known = sorted(os.listdir("data"), key=lambda x: x.split(".")[0])
except:
    known = list()


def df_to_data(df, output_dir="data"):
    os.makedirs(output_dir, exist_ok=True)
    
    # Group by 'slot' and sort the slots once
    grouped = df.groupby('slot')
    known = sorted(os.listdir(output_dir), key=lambda x: x.split(".")[0])

    for slot, group in grouped:
        print(f"{slot}/{df.slot.max()}")
        
        slot_data = {}
        # Get the network for the group (assuming all rows in a group have the same network)
        network = group['network'].iloc[0]  # Take the first network value in the group
        
        # Convert rows to dictionaries at once (avoiding iterrows)
        for _, row in group.iterrows():
            row_dict = row.to_dict()
            row_dict["timestamp"] = str(row_dict["timestamp"]) if pd.notna(row_dict.get("timestamp")) else None
            slot_data[row_dict['client']] = row_dict
        
        # Define the file path using the slot number and network
        file_path = os.path.join(output_dir, network, f"{slot}.json")
        os.makedirs(os.path.join(output_dir, network), exist_ok=True)
        
        # Write the JSON file
        with open(file_path, "w") as f:
            json.dump(slot_data, f, indent=4)
        
        print(f"Saved slot {slot} for network {network} to {file_path}")

        # Clean up old files if more than 300
        if len(known) > 50:
            os.remove(os.path.join(output_dir, known[0]))
            print(f"Removed slot {slot} from {output_dir}/{network}/{known[0]}")
            known.pop(0)  # Remove the first element after deletion to keep the list updated

df_to_data(df)