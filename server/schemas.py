from pydantic import BaseModel
from typing import List

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    deposit_paid: bool

    class Config:
        from_attributes = True

class HabitCreate(BaseModel):
    name: str
    why: str
    time: str

class HabitOut(HabitCreate):
    id: int

    class Config:
        from_attributes = True