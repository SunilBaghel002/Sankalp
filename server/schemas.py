# server/schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import date

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    deposit_paid: bool

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

class CheckInCreate(BaseModel):
    habit_id: int
    date: str
    completed: bool