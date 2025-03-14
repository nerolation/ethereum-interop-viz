#!/bin/bash

echo "Starting Ethereum Slot Visualization Backend..."

# Activate the virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment at venv"
    source venv/bin/activate
fi

# Print Python information for debugging
which python
python --version

# Run the Flask app
cd backend
python app.py 