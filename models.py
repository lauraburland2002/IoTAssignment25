from pydantic import BaseModel
from datetime import datetime

# Input models
class VoteCreate(BaseModel):
    temperature: float
    user_email: str = None

class UserLogin(BaseModel):
    email: str
    password: str

class FeedbackCreate(BaseModel):
    user_id: int
    rating: float = None
    survey_answers: str = None

class VotingWindow(BaseModel):
    start_1: str  # e.g. "09:00"
    end_1: str    # e.g. "09:15"
    start_2: str
    end_2: str

class WindowUpdate(BaseModel):
    start_time: str  # e.g., "08:30"

# Response models
class VoteResponse(BaseModel):
    id: int
    temperature: float
    timestamp: datetime
    
    class Config:
        orm_mode = True