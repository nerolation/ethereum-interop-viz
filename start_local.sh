#!/bin/bash

# Start the Ethereum Slot Visualization locally
echo "Starting Ethereum Slot Visualization locally..."

# Function to clean up processes on exit
cleanup() {
    echo "Cleaning up processes..."
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Killing backend process $BACKEND_PID"
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$SCHEDULER_PID" ]; then
        echo "Killing scheduler process $SCHEDULER_PID"
        kill $SCHEDULER_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Killing frontend process $FRONTEND_PID"
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up trap to clean up on exit
trap cleanup EXIT INT TERM

# Activate virtual environment
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
else
    echo "Virtual environment not found. Please create it first."
    exit 1
fi

# Create data directories if they don't exist
mkdir -p backend/data/mainnet backend/data/sepolia backend/data/holesky

# Start the backend on port 5001 (to avoid conflicts)
echo "Starting backend on port 5001..."
cd backend
PORT=5001 python app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 3

# Start the scheduler
echo "Starting scheduler..."
cd backend
python scheduler.py &
SCHEDULER_PID=$!
cd ..

# Start the frontend with the correct API port
echo "Starting frontend..."
cd frontend
REACT_APP_API_PORT=5001 npm start &
FRONTEND_PID=$!
cd ..

echo "All services started. Press Ctrl+C to stop."
echo "Backend running on http://localhost:5001"
echo "Frontend running on http://localhost:3000"

# Wait for all processes to finish
wait $BACKEND_PID $SCHEDULER_PID $FRONTEND_PID 