from pydantic import BaseModel
from typing import List

class GoogleToken(BaseModel):
    token: str

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    deposit_paid: bool

class HabitCreate(BaseModel):
    name: str
    why: str
    time: str

class HabitOut(HabitCreate):
    id: int