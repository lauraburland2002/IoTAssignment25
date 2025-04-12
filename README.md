# AirVote Backend

This is the backend server for the **AirVote** project, which allows employees to vote on their preferred office temperature twice daily. The backend is built with FastAPI and uses SQLite for data storage.

## Features
- Submit temperature votes
- Retrieve the average of recent votes (in the past voting window)
- View all submitted votes
- Lightweight and self-contained, no third-party services

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/airvote-backend.git
cd airvote-backend
```

### 2. Set up a virtual environment (optional)
```bash
python -m venv env
source env/bin/activate  # On Windows use `env\Scripts\activate`
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the server
```bash
uvicorn main:app --reload
```

The API will be running at `http://127.0.0.1:8000`.

## API Endpoints

### Submit a Vote
`POST /vote?temp=21.5`

### Get Current Average
`GET /average`

### View All Votes
`GET /all-votes`

## Notes
- Votes are stored in a local SQLite database (`votes.db`).
- Averages are calculated from votes within the past hour.

## IoT Integration
Your Raspberry Pi or IoT device can poll the `/average` endpoint to adjust the thermostat accordingly.
