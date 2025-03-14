#!/bin/bash

echo "Starting Ethereum Slot Visualization Backend..."

# Activate the virtual environment
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
VENV_DIR="$SCRIPT_DIR/../venv"

if [ -d "$VENV_DIR" ]; then
    echo "Activating virtual environment at $VENV_DIR"
    source "$VENV_DIR/bin/activate"
    
    # Print Python information for debugging
    which python
    python --version
    
    # Run the Flask app
    python "$SCRIPT_DIR/app.py"
else
    echo "Error: Virtual environment not found at $VENV_DIR"
    exit 1
fi 