from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List

from database import create_db_and_tables, get_session  # ← no dot
from models import User, Habit                          # ← no dot
from schemas import GoogleToken, UserOut, HabitCreate, HabitOut  # ← no dot
from auth import verify_google_token, create_access_token, get_current_user

app = FastAPI(title="Sankalp Backend")

# CORS - Allow your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Google Login Endpoint
@app.post("/auth/google")
async def login_google(token: GoogleToken, session: Session = Depends(get_session)):
    payload = verify_google_token(token.token)
    
    user = session.exec(select(User).where(User.google_id == payload["sub"])).first()
    
    if not user:
        user = User(
            email=payload["email"],
            name=payload.get("name", "User"),
            google_id=payload["sub"]
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    
    access_token = create_access_token(data={"sub": user.email})
    
    response = JSONResponse({"message": "Login successful"})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=30*24*60*60,
        expires=30*24*60*60,
        secure=False,  # True in production
        samesite="lax"
    )
    return response

# Protected Routes
@app.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/habits")
async def create_habits(habits: List[HabitCreate], user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    for h in habits:
        habit = Habit(**h.dict(), user_id=user.id)
        session.add(habit)
    session.commit()
    return {"message": "Habits saved!"}

@app.get("/habits", response_model=List[HabitOut])
async def get_habits(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    habits = session.exec(select(Habit).where(Habit.user_id == user.id)).all()
    return habits

@app.post("/deposit-paid")
async def mark_deposit_paid(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    user.deposit_paid = True
    session.add(user)
    session.commit()
    return {"message": "Deposit marked as paid"}

@app.post("/auth/google/callback")
async def google_callback(code: dict, session: Session = Depends(get_session)):
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code["code"],
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),  # Add this to .env
        "redirect_uri": "http://localhost:5173/auth/callback",
        "grant_type": "authorization_code",
    }
    token_res = requests.post(token_url, data=data)
    token_res.raise_for_status()
    id_token = token_res.json()["id_token"]

    payload = verify_google_token(id_token)