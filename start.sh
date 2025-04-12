#!/bin/bash

# Check if virtual environment exists
if [ ! -d "venv" ]; then
  echo "Virtual environment not found. Creating one..."
  python3 -m venv venv
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies (if necessary)
echo "Installing dependencies..."
pip install -r requirements.txt

# Set default host and port if not provided
HOST=${HOST:-"127.0.0.1"}
PORT=${PORT:-"8000"}

# Run the FastAPI app with Uvicorn
echo "Starting FastAPI app on $HOST:$PORT..."
uvicorn main:app --host $HOST --port $PORT --reload

# Usage instructions
echo "To execute this script, ensure it has execute permissions:"
echo "chmod +x start.sh"
echo "Then run:"
echo "./start.sh"
