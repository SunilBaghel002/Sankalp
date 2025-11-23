# server/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


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