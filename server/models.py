# server/models.py
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class User(BaseModel):
    id: Optional[int] = None
    email: str
    name: str
    google_id: str
    deposit_paid: bool = False
    created_at: Optional[datetime] = None

    @classmethod
    def from_supabase(cls, data: Dict[str, Any]) -> "User":
        return cls(**data)

class Habit(BaseModel):
    id: Optional[int] = None
    user_id: int
    name: str
    why: str
    time: str = "08:00"
    created_at: Optional[datetime] = None

    @classmethod
    def from_supabase(cls, data: Dict[str, Any]) -> "Habit":
        return cls(**data)

class CheckIn(BaseModel):
    id: Optional[int] = None
    user_id: int
    habit_id: int
    date: str
    completed: bool = False
    created_at: Optional[datetime] = None