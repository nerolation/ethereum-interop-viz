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

echo "Setup complete! You can now deploy your app with:"
echo "git push heroku main" 