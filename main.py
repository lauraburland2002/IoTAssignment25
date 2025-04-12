from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, time
from database import SessionLocal, Vote, User, hash_password, verify_password
from fastapi.middleware.cors import CORSMiddleware
import requests
from pydantic import BaseModel
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi import Request

app = FastAPI()

# CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Jinja2Templates for rendering HTML templates
templates = Jinja2Templates(directory="templates")

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



from datetime import datetime, timedelta, time

# Define two configurable voting windows (can be modified via the admin page)
voting_window_1_start = time(9, 0)
voting_window_2_start = time(13, 0)

def is_within_voting_window(current: datetime) -> bool:
    now_time = current.time()
    
    # Calculate both 15-minute windows
    window1_end = (datetime.combine(datetime.today(), voting_window_1_start) + timedelta(minutes=15)).time()
    window2_end = (datetime.combine(datetime.today(), voting_window_2_start) + timedelta(minutes=15)).time()

    return (voting_window_1_start <= now_time <= window1_end) or (voting_window_2_start <= now_time <= window2_end)



# Vote Submission Endpoint
@app.post("/vote")
def submit_vote(temp: float, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    if not is_within_voting_window(now):
        raise HTTPException(status_code=403, detail="Voting is only allowed from 9–9:15 AM and 1–1:15 PM UTC.")

    vote = Vote(temperature=temp, timestamp=now)
    db.add(vote)
    db.commit()
    return {"message": "Vote recorded!"}

# Get Average Temperature Endpoint
@app.get("/average")
def get_average(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    votes = db.query(Vote).filter(Vote.timestamp >= one_hour_ago).all()

    if not votes:
        return {"average": None}

    average = round(sum(v.temperature for v in votes) / len(votes), 1)

    # Simulate pushing average to IoT device using mock data
    try:
        # Mock IoT device endpoint
        mock_iot_device_url = "http://localhost:5000/set-temperature"
        response = requests.post(mock_iot_device_url, json={"temperature": average})
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Error sending to IoT device: {e}")

    return {"average": average}

# Get All Votes Endpoint
@app.get("/all-votes")
def get_all_votes(db: Session = Depends(get_db)):
    return db.query(Vote).all()

# Pydantic model for user login
class UserLogin(BaseModel):
    email: str
    password: str

# User Login Endpoint
@app.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify the password
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"message": "Login successful"}

# Route to serve the admin page
@app.get("/admin", response_class=HTMLResponse)
def get_admin_page(request: Request, db: Session = Depends(get_db)):
    # Check if the user has admin rights (this is a placeholder check, adjust as needed)
    # For now, let's assume you check a simple user flag or session
    user_is_admin = True  # Replace with actual check
    
    if not user_is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Get the list of votes during the last voting window
    now = datetime.utcnow()
    start_time = now - timedelta(hours=1)  # Example: fetch last hour's votes, adjust as needed
    votes = db.query(Vote).filter(Vote.timestamp >= start_time).all()

    # Render the admin page with the data
    return templates.TemplateResponse("admin.html", {"request": request, "votes": votes})


from pydantic import BaseModel

# Store these in memory for now – you could store in DB if needed
current_voting_windows = []

class WindowUpdate(BaseModel):
    start_time: str  # e.g., "08:30"

@app.post("/update-voting-window")
def update_voting_window(update: WindowUpdate):
    try:
        hour, minute = map(int, update.start_time.split(":"))
        start = time(hour, minute)
        end = (datetime.combine(datetime.today(), start) + timedelta(minutes=15)).time()

        current_voting_windows.clear()
        current_voting_windows.append((start, end))

        return {"message": f"Voting window set to {start.strftime('%H:%M')} - {end.strftime('%H:%M')}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid time format")

from fastapi import Request
from pywebpush import webpush, WebPushException

subscriptions = []  # In-memory list; use DB in production

@app.post("/subscribe")
async def subscribe(request: Request):
    subscription_info = await request.json()
    subscriptions.append(subscription_info)
    return {"message": "Subscription saved"}

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, time
from pywebpush import webpush, WebPushException
import json

voting_windows = [
    (time(9, 0), time(9, 15)),
    (time(13, 0), time(13, 15)),
]

subscriptions = []  # Ideally store this in your DB

def notify_users():
    now = datetime.utcnow().time()
    for start, _ in voting_windows:
        if now.hour == start.hour and now.minute == start.minute:
            for sub in subscriptions:
                try:
                    webpush(
                        subscription_info=sub,
                        data=json.dumps({
                            "title": "AirVote - It's Time To Vote!",
                            "body": "Click here to cast your temperature vote.",
                            "url": "https://yourdomain.com/index.html"
                        }),
                        vapid_private_key="your-private-key",
                        vapid_claims={"sub": "mailto:your@email.com"}
                    )
                except WebPushException as e:
                    print("Push failed: ", e)

scheduler = BackgroundScheduler()
scheduler.add_job(notify_users, "interval", minutes=1)
scheduler.start()




@app.post("/vote")
def submit_vote(temp: float, user_email: str, db: Session = Depends(get_db)):
    # Increment the user's vote count
    user = db.query(User).filter(User.email == user_email).first()
    if user:
        user.votes_count += 1
        db.commit()

    # After the first vote (vote_count == 1), ask for a rating
    if user.votes_count == 1:
        # Trigger star rating prompt (on the frontend)
        return {"message": "Thanks for your vote! Please rate us out of 5 stars."}

    # Every 10th vote, ask for feedback again
    elif user.votes_count % 10 == 0:
        return {"message": "We hope you're enjoying your experience - rate us here"}

    # After the 15th vote, ask for a survey
    elif user.votes_count == 15:
        return {"message": "Thanks for being a loyal user! Here is an opportunity to complete a short 5-question survey."}

    # Default response for a regular vote
    return {"message": "Vote recorded!"}

# Endpoint to submit feedback (star rating or survey)
@app.post("/submit-feedback")
def submit_feedback(feedback: Feedback, db: Session = Depends(get_db)):
    # Save feedback to the database
    db.add(feedback)
    db.commit()
    return {"message": "Thank you for your feedback! We appreciate it"}

