from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import json
import glob
import logging

# Configure the static folder path to point to the frontend build directory
static_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend/build')
app = Flask(__name__, static_folder=static_folder, static_url_path='')

# Enable CORS for all routes and origins
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = app.logger

NETWORKS = ["mainnet", "sepolia", "holesky"]
# Use absolute path for DATA_DIR, with special handling for Heroku
if os.environ.get('DYNO'):  # We're on Heroku
    DATA_DIR = "/app/backend/data"
else:  # We're running locally
    # Use absolute path to avoid nested directories
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    DATA_DIR = os.path.join(parent_dir, "data")
logger.info(f"Using data directory: {DATA_DIR}")
DEFAULT_SLOT_COUNT = 20  # Increased from 10 to ensure we have enough data

@app.route('/')
def serve():
    """
    Serve the frontend application
    """
    logger.info("Serving index.html")
    return app.send_static_file('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    """
    Serve static files
    """
    logger.info(f"Serving static file: {path}")
    return send_from_directory(os.path.join(static_folder, 'static'), path)

@app.route('/api/slots/<network>', methods=['GET'])
def get_latest_slots(network):
    """
    Get the latest slots for the specified network
    """
    # Get the number of slots to return from query parameter, default to DEFAULT_SLOT_COUNT
    count = request.args.get('count', default=DEFAULT_SLOT_COUNT, type=int)
    
    logger.info(f"[API] Received request for {count} slots in network: {network}")
    
    if network not in NETWORKS:
        logger.warning(f"[API] Invalid network requested: {network}")
        return jsonify({"error": f"Invalid network. Choose from {NETWORKS}"}), 400
    
    # Get all JSON files in the network directory
    network_dir = os.path.join(DATA_DIR, network)
    logger.info(f"[API] Looking for data in directory: {network_dir}")
    
    if not os.path.exists(network_dir):
        logger.warning(f"[API] No data directory found for network: {network}")
        return jsonify([]), 200
    
    # Get all JSON files
    json_files = glob.glob(os.path.join(network_dir, "*.json"))
    
    if not json_files:
        logger.warning(f"[API] No slot files found for network: {network}")
        return jsonify([]), 200
    
    logger.info(f"[API] Found {len(json_files)} slot files for network {network}")
    
    try:
        # Sort files by slot number (descending) to get the highest slots first
        json_files.sort(key=lambda x: int(os.path.basename(x).split('.')[0]), reverse=True)
        logger.info(f"[API] Sorted files, highest slot: {os.path.basename(json_files[0]).split('.')[0] if json_files else 'N/A'}")
        
        # Take the latest 'count' files, but don't try to take more than exist
        latest_files = json_files[:min(count, len(json_files))]
        logger.info(f"[API] Selected {len(latest_files)} files out of {len(json_files)} available")
        
        # Log the selected file names for debugging
        logger.info(f"[API] Selected files: {[os.path.basename(f) for f in latest_files]}")
        
        # Load the data from each file
        slots_data = []
        for file_path in latest_files:
            try:
                slot_number = int(os.path.basename(file_path).split('.')[0])
                logger.info(f"[API] Loading slot {slot_number} from {file_path}")
                
                # Read the file content as a string first
                with open(file_path, 'r') as f:
                    file_content = f.read()
                
                # Replace NaN values with null (which is valid JSON)
                file_content = file_content.replace('NaN', 'null')
                
                # Parse the modified JSON
                slot_data = json.loads(file_content)
                
                # Check if the slot data is valid
                if not slot_data:
                    logger.warning(f"[API] Empty data in file {file_path}")
                    continue
                    
                # Log the clients found in this slot
                logger.info(f"[API] Slot {slot_number} has data for clients: {list(slot_data.keys())}")
                
                # Add the slot number to the data
                slots_data.append({
                    "slot": slot_number,
                    "data": slot_data
                })
            except Exception as e:
                logger.error(f"[API] Error loading file {file_path}: {str(e)}")
        
        # Double-check the slots are sorted by slot number (descending)
        slots_data.sort(key=lambda x: x["slot"], reverse=True)
        
        if slots_data:
            slot_numbers = [slot["slot"] for slot in slots_data]
            logger.info(f"[API] Returning {len(slots_data)} slots for network {network}")
            logger.info(f"[API] Slot numbers: {slot_numbers}")
        else:
            logger.warning(f"[API] No valid slot data found for network {network}")
        
        return jsonify(slots_data)
    except Exception as e:
        logger.error(f"[API] Unexpected error processing slots for {network}: {str(e)}")
        return jsonify([]), 200

@app.route('/api/networks', methods=['GET'])
def get_networks():
    """
    Get a list of available networks
    """
    logger.info("Received request for available networks")
    
    available_networks = []
    for network in NETWORKS:
        network_dir = os.path.join(DATA_DIR, network)
        if os.path.exists(network_dir) and os.listdir(network_dir):
            available_networks.append(network)
    
    logger.info(f"Available networks: {available_networks}")
    return jsonify(available_networks)

@app.route('/api/clients', methods=['GET'])
def get_clients():
    """
    Get a list of all clients across all networks
    """
    logger.info("Received request for available clients")
    
    clients = set()
    
    for network in NETWORKS:
        network_dir = os.path.join(DATA_DIR, network)
        if not os.path.exists(network_dir):
            continue
        
        # Get the first JSON file to extract client names
        json_files = glob.glob(os.path.join(network_dir, "*.json"))
        if json_files:
            try:
                # Read the file content as a string first
                with open(json_files[0], 'r') as f:
                    file_content = f.read()
                
                # Replace NaN values with null (which is valid JSON)
                file_content = file_content.replace('NaN', 'null')
                
                # Parse the modified JSON
                slot_data = json.loads(file_content)
                
                for client in slot_data.keys():
                    clients.add(client)
            except Exception as e:
                logger.error(f"Error loading file {json_files[0]}: {str(e)}")
    
    client_list = list(clients)
    logger.info(f"Available clients: {client_list}")
    return jsonify(client_list)

# Catch-all route to serve the React app for any other routes
@app.route('/<path:path>')
def catch_all(path):
    """
    Catch-all route to serve the React app
    """
    logger.info(f"Catch-all route: {path}")
    return app.send_static_file('index.html')

if __name__ == '__main__':
    logger.info("Starting Ethereum Slot Visualization API server")
    logger.info(f"Data directory: {DATA_DIR}")
    # Try to use port 5000, but fall back to other ports if it's already in use
    port = int(os.environ.get('PORT', 5000))
    try:
        app.run(debug=True, host='0.0.0.0', port=port)
    except OSError as e:
        if "Address already in use" in str(e):
            logger.warning(f"Port {port} is already in use, trying port {port+1}")
            app.run(debug=True, host='0.0.0.0', port=port+1)
        else:
            raise 