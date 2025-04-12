from fastapi import FastAPI, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, time
from database import SessionLocal, Vote, User, Feedback, hash_password, verify_password
from models import VoteCreate, UserLogin, FeedbackCreate, VotingWindow, WindowUpdate
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import requests
import json
from typing import List, Tuple
from pywebpush import webpush, WebPushException
from apscheduler.schedulers.background import BackgroundScheduler

# Create FastAPI application
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Templates setup
templates = Jinja2Templates(directory="templates")

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Push notification settings
VAPID_PUBLIC_KEY = "your-public-key"
VAPID_PRIVATE_KEY = "your-private-key"
subscriptions = []  # In-memory storage; use DB in production

# Voting window settings (default values)
voting_windows: List[Tuple[time, time]] = [
    (time(9, 0), time(9, 15)),  # 9:00 AM - 9:15 AM
    (time(13, 0), time(13, 15))  # 1:00 PM - 1:15 PM
]

# Temperature validation
def validate_temperature(temp: float) -> bool:
    return 15 <= temp <= 25

# Check if current time is within a voting window
def is_within_voting_window(current: datetime) -> bool:
    now_time = current.time()
    
    for start, end in voting_windows:
        if start <= now_time <= end:
            return True
    
    return False

# Validate voting windows don't overlap
def times_overlap(start1, end1, start2, end2):
    return max(start1, start2) < min(end1, end2)

# Endpoints
@app.post("/vote")
def submit_vote(vote: VoteCreate, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    
    # Validate voting window
    if not is_within_voting_window(now):
        raise HTTPException(status_code=403, 
                          detail="Voting is only allowed during designated voting windows.")
    
    # Validate temperature
    if not validate_temperature(vote.temperature):
        raise HTTPException(status_code=400, 
                          detail="Temperature must be between 15°C and 25°C.")
    
    # Create vote record
    vote_record = Vote(temperature=vote.temperature, timestamp=now)
    db.add(vote_record)
    
    # Increment user vote count if user_email provided
    response_message = "Vote recorded!"
    if vote.user_email:
        user = db.query(User).filter(User.email == vote.user_email).first()
        if user:
            user.votes_count += 1
            
            # Custom messages based on vote count
            if user.votes_count == 1:
                response_message = "Thanks for your vote! Please rate us out of 5 stars."
            elif user.votes_count % 10 == 0:
                response_message = "We hope you're enjoying your experience - rate us here"
            elif user.votes_count == 15:
                response_message = "Thanks for being a loyal user! Here is an opportunity to complete a short 5-question survey."
    
    db.commit()
    return {"message": response_message}

@app.get("/average")
def get_average(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    votes = db.query(Vote).filter(Vote.timestamp >= one_hour_ago).all()

    if not votes:
        return {"average": None}

    average = round(sum(v.temperature for v in votes) / len(votes), 1)

    # Simulate pushing average to IoT device
    try:
        mock_iot_device_url = "http://localhost:5000/set-temperature"
        response = requests.post(mock_iot_device_url, json={"temperature": average})
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Error sending to IoT device: {e}")

    return {"average": average}

@app.get("/all-votes")
def get_all_votes(db: Session = Depends(get_db)):
    return db.query(Vote).all()

@app.get("/votes/latest")
def get_latest_votes(db: Session = Depends(get_db)):
    now = datetime.utcnow()

    # Get the most recent 15-minute interval start
    interval_start = now.replace(minute=(now.minute // 15) * 15, second=0, microsecond=0)
    interval_end = interval_start + timedelta(minutes=15)

    recent_votes = db.query(Vote).filter(
        Vote.timestamp >= interval_start,
        Vote.timestamp < interval_end
    ).all()

    return [
        {
            "username": vote.username,
            "timestamp": vote.timestamp.isoformat(),
            "temperature": vote.temperature
        }
        for vote in recent_votes
    ]

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

@app.post("/submit-feedback")
def submit_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    new_feedback = Feedback(**feedback.dict())
    db.add(new_feedback)
    db.commit()
    return {"message": "Thank you for your feedback! We appreciate it"}

@app.get("/admin", response_class=HTMLResponse)
def get_admin_page(request: Request, db: Session = Depends(get_db)):
    # Check if the user has admin rights (placeholder check)
    user_is_admin = True  # Replace with actual check
    
    if not user_is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Get votes from the last hour
    now = datetime.utcnow()
    start_time = now - timedelta(hours=1)
    votes = db.query(Vote).filter(Vote.timestamp >= start_time).all()

    # Render the admin page with the data
    return templates.TemplateResponse("admin.html", {"request": request, "votes": votes})

@app.post("/update-voting-window")
def update_voting_window(update: WindowUpdate):
    try:
        hour, minute = map(int, update.start_time.split(":"))
        start = time(hour, minute)
        end = (datetime.combine(datetime.today(), start) + timedelta(minutes=15)).time()

        global voting_windows
        voting_windows = [(start, end)]

        return {"message": f"Voting window set to {start.strftime('%H:%M')} - {end.strftime('%H:%M')}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid time format")

@app.post("/update_custom_voting_windows")
def update_custom_voting_windows(windows: VotingWindow):
    try:
        s1 = datetime.strptime(windows.start_1, "%H:%M").time()
        e1 = datetime.strptime(windows.end_1, "%H:%M").time()
        s2 = datetime.strptime(windows.start_2, "%H:%M").time()
        e2 = datetime.strptime(windows.end_2, "%H:%M").time()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")

    if times_overlap(s1, e1, s2, e2):
        raise HTTPException(status_code=400, detail="Voting windows must not overlap.")

    global voting_windows
    voting_windows = [(s1, e1), (s2, e2)]

    return {"message": "Voting windows updated successfully."}

@app.post("/subscribe")
async def subscribe(request: Request):
    subscription_info = await request.json()
    subscriptions.append(subscription_info)
    return {"message": "Subscription saved"}

# Push notification function
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
                        vapid_private_key=VAPID_PRIVATE_KEY,
                        vapid_claims={"sub": "mailto:admin@yourdomain.com"}
                    )
                except WebPushException as e:
                    print("Push failed: ", e)

# Initialize the scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(notify_users, "interval", minutes=1)

@app.on_event("startup")
def startup_event():
    scheduler.start()