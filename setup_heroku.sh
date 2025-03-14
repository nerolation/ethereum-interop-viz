#!/bin/bash

# This script prepares your project for Heroku deployment

# Install Heroku CLI if not already installed
if ! command -v heroku &> /dev/null; then
    echo "Installing Heroku CLI..."
    curl https://cli-assets.heroku.com/install.sh | sh
else
    echo "Heroku CLI already installed."
fi

# Login to Heroku
echo "Please log in to Heroku:"
heroku login

# Create a new Heroku app
echo "Creating a new Heroku app..."
heroku create ethereum-interop-viz

# Add Python buildpack
echo "Adding Python buildpack..."
heroku buildpacks:add heroku/python

# Add Node.js buildpack
echo "Adding Node.js buildpack..."
heroku buildpacks:add heroku/nodejs

# Create necessary directories for data if they don't exist
mkdir -p backend/data/mainnet
mkdir -p backend/data/sepolia
mkdir -p backend/data/holesky

# Copy sample data if needed
echo "Ensuring data directories are set up..."

# Set up Git remote
echo "Setting up Git remote..."
heroku git:remote -a ethereum-interop-viz

# Set up pyxatu configuration as environment variables
echo "Setting up pyxatu configuration as environment variables..."
if [ -f ~/.pyxatu_config.json ]; then
    CLICKHOUSE_USER=$(grep -o '"CLICKHOUSE_USER": *"[^"]*"' ~/.pyxatu_config.json | cut -d'"' -f4)
    CLICKHOUSE_PASSWORD=$(grep -o '"CLICKHOUSE_PASSWORD": *"[^"]*"' ~/.pyxatu_config.json | cut -d'"' -f4)
    CLICKHOUSE_URL=$(grep -o '"CLICKHOUSE_URL": *"[^"]*"' ~/.pyxatu_config.json | cut -d'"' -f4)
    
    heroku config:set CLICKHOUSE_USER="$CLICKHOUSE_USER" --app ethereum-interop-viz
    heroku config:set CLICKHOUSE_PASSWORD="$CLICKHOUSE_PASSWORD" --app ethereum-interop-viz
    heroku config:set CLICKHOUSE_URL="$CLICKHOUSE_URL" --app ethereum-interop-viz
    
    echo "pyxatu configuration has been set as environment variables in Heroku."
else
    echo "Warning: ~/.pyxatu_config.json not found. Please set the following environment variables manually:"
    echo "heroku config:set CLICKHOUSE_USER=your_user --app ethereum-interop-viz"
    echo "heroku config:set CLICKHOUSE_PASSWORD=your_password --app ethereum-interop-viz"
    echo "heroku config:set CLICKHOUSE_URL=your_url --app ethereum-interop-viz"
fi

# Set up scheduler configuration
echo "Setting up scheduler configuration..."
heroku config:set XATU_UPDATE_INTERVAL=300 --app ethereum-interop-viz

# Enable both web and worker dynos
echo "Enabling web and worker dynos..."
heroku ps:scale web=1 worker=1 --app ethereum-interop-viz

echo "Setup complete! You can now deploy your app with:"
echo "git push heroku main" 