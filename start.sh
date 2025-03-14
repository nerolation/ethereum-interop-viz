#!/bin/bash

# Start the Flask backend
echo "Starting Flask backend..."
cd backend
chmod +x start_backend.sh
./start_backend.sh &
BACKEND_PID=$!
cd ..

# Wait for the backend to start
echo "Waiting for backend to start..."
sleep 5

# Start the React frontend
echo "Starting React frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Function to handle script termination
cleanup() {
  echo "Shutting down services..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit 0
}

# Register the cleanup function for when the script is terminated
trap cleanup SIGINT SIGTERM

echo "Both services are running. Press Ctrl+C to stop."

# Keep the script running
wait 