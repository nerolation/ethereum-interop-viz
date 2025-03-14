# Ethereum Interoperability Visualization

A real-time visualization tool for Ethereum consensus client interoperability, showing slot production across different networks (Mainnet, Sepolia, Holesky) and clients (Lighthouse, Prysm, Teku, Nimbus, Lodestar).

## Features

- Real-time slot visualization with 12-second auto-refresh
- Support for multiple Ethereum networks (Mainnet, Sepolia, Holesky)
- Client filtering to focus on specific consensus clients
- Detailed slot information including status, timestamp, and block hashes
- Visual indicators for slot status (produced, missed, reorged)
- Proposer boost highlighting for slots seen in under 4 seconds
- Debug information panel for troubleshooting
- Responsive design with dark/light mode support

## Architecture

- **Frontend**: React with Material-UI for the user interface
- **Backend**: Flask API serving slot data
- **Data Source**: Preprocessed Ethereum slot data stored as JSON files

## Setup

### Prerequisites

- Node.js (v14+)
- Python 3.8+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```
   bash start_backend.sh
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

- Use the network selector in the header to switch between Ethereum networks
- Toggle client visibility using the client filter checkboxes
- Adjust the number of visible slots using the slider
- Click on individual slots to view detailed information
- Toggle the debug panel for troubleshooting information

## License

MIT 