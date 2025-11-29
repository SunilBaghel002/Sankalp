# server/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date, time


class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    google_id: Optional[str] = None  # ✅ Made optional
    deposit_paid: bool = False
    login_type: Optional[str] = "google"
    email_verified: Optional[bool] = False
    created_at: Optional[datetime] = None


class HabitCreate(BaseModel):
    name: str
    why: str
    time: str = "08:00"


class HabitOut(BaseModel):
    id: int
    user_id: int
    name: str
    why: str
    time: str
    created_at: Optional[datetime] = None


class CheckInCreate(BaseModel):
    habit_id: int
    date: str  # Format: "YYYY-MM-DD"
    completed: bool = False


class CheckInOut(BaseModel):
    id: int
    user_id: int
    habit_id: int
    date: str
    completed: bool
    created_at: Optional[datetime] = None
    
class DailyThoughtCreate(BaseModel):
    date: str
    thought: str

class DailyThoughtOut(BaseModel):
    id: int
    user_id: int
    date: str
    thought: str
    created_at: Optional[str] = None

class SleepRecordCreate(BaseModel):
    date: str
    sleep_time: str  # HH:MM format
    wake_time: str   # HH:MM format

class SleepRecordOut(BaseModel):
    id: int
    user_id: int
    date: str
    sleep_time: str
    wake_time: str
    sleep_hours: float
    created_at: Optional[str] = None

class MonthlyAnalysisRequest(BaseModel):
    year: int
    month: int

class HabitCompletionData(BaseModel):
    date: str
    habits: dict  # {habit_id: bool}
    all_completed: bool

class AnalysisResponse(BaseModel):
    thoughts: List[DailyThoughtOut]
    sleep_records: List[SleepRecordOut]
    habit_completions: List[HabitCompletionData]