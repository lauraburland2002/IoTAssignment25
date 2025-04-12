#!/bin/bash

# Activate the virtual environment
source venv/bin/activate

# Install dependencies (if necessary)
pip install -r requirements.txt

# Run the FastAPI app with Uvicorn
uvicorn main:app --reload

# execute with this command
chmod +x start.sh

# then in bash run this
#./start.sh

