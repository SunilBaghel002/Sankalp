# server/models.py
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class User(BaseModel):
    id: int
    email: EmailStr
    name: str
    google_id: Optional[str] = None  # ✅ FIXED: Made optional for email users
    deposit_paid: bool = False
    password_hash: Optional[str] = None  # ✅ Added for email auth
    login_type: Optional[str] = "google"  # ✅ Added to track login method
    email_verified: Optional[bool] = False  # ✅ Added for email verification
    created_at: Optional[datetime] = None

    @classmethod
    def from_supabase(cls, data: dict):
        """Create User instance from Supabase response"""
        # Clean up the data to handle None values
        cleaned_data = {
            "id": data.get("id"),
            "email": data.get("email"),
            "name": data.get("name"),
            "google_id": data.get("google_id"),  # Can be None
            "deposit_paid": data.get("deposit_paid", False),
            "password_hash": data.get("password_hash"),  # Can be None
            "login_type": data.get("login_type", "google"),
            "email_verified": data.get("email_verified", False),
            "created_at": data.get("created_at")
        }
        return cls(**cleaned_data)


class Habit(BaseModel):
    id: Optional[int] = None
    user_id: int
    name: str
    why: str
    time: str = "08:00"
    created_at: Optional[datetime] = None

    @classmethod
    def from_supabase(cls, data: dict):
        """Create Habit instance from Supabase response"""
        return cls(**data)


class CheckIn(BaseModel):
    id: Optional[int] = None
    user_id: int
    habit_id: int
    date: str  # Format: "YYYY-MM-DD"
    completed: bool = False
    created_at: Optional[datetime] = None

    @classmethod
    def from_supabase(cls, data: dict):
        """Create CheckIn instance from Supabase response"""
        return cls(**data)