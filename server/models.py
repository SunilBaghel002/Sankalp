# server/models.py
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from datetime import datetime


@dataclass
class User:
    id: int
    email: str
    name: str
    google_id: Optional[str] = None
    deposit_paid: bool = False
    password_hash: Optional[str] = None
    login_type: str = "google"
    email_verified: bool = False
    push_subscriptions: Optional[List[Dict]] = None
    notification_preferences: Optional[Dict] = None
    current_streak: int = 0
    total_xp: int = 0
    badges: Optional[List[str]] = None
    calendar_tokens: Optional[Dict] = None
    email_notifications: bool = True
    reminder_time: Optional[str] = None
    created_at: Optional[str] = None
    
    @classmethod
    def from_supabase(cls, data: dict) -> "User":
        """Create User instance from Supabase response"""
        return cls(
            id=data.get("id"),
            email=data.get("email", ""),
            name=data.get("name", "User"),
            google_id=data.get("google_id"),
            deposit_paid=data.get("deposit_paid", False),
            password_hash=data.get("password_hash"),
            login_type=data.get("login_type", "google"),
            email_verified=data.get("email_verified", False),
            push_subscriptions=data.get("push_subscriptions", []),
            notification_preferences=data.get("notification_preferences", {}),
            current_streak=data.get("current_streak", 0),
            total_xp=data.get("total_xp", 0),
            badges=data.get("badges", []),
            calendar_tokens=data.get("calendar_tokens"),
            email_notifications=data.get("email_notifications", True),
            reminder_time=data.get("reminder_time"),
            created_at=data.get("created_at"),
        )


@dataclass
class Habit:
    id: int
    user_id: int
    name: str
    why: str
    time: str
    calendar_event_id: Optional[str] = None
    created_at: Optional[str] = None
    
    @classmethod
    def from_supabase(cls, data: dict) -> "Habit":
        return cls(
            id=data.get("id"),
            user_id=data.get("user_id"),
            name=data.get("name", ""),
            why=data.get("why", ""),
            time=data.get("time", "09:00"),
            calendar_event_id=data.get("calendar_event_id"),
            created_at=data.get("created_at"),
        )


@dataclass
class CheckIn:
    id: int
    user_id: int
    habit_id: int
    date: str
    completed: bool
    created_at: Optional[str] = None
    
    @classmethod
    def from_supabase(cls, data: dict) -> "CheckIn":
        return cls(
            id=data.get("id"),
            user_id=data.get("user_id"),
            habit_id=data.get("habit_id"),
            date=data.get("date"),
            completed=data.get("completed", False),
            created_at=data.get("created_at"),
        )