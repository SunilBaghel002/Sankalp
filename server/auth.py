# auth.py — PERFECT, NO CHANGES NEEDED
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import requests
from sqlmodel import Session, select
from fastapi import Request, Depends, HTTPException, status

from models import User
from database import get_session

load_dotenv()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

def verify_google_token(token: str):
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
    response = requests.get(url)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    
    payload = response.json()
    if payload.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=400, detail="Invalid audience")
    
    return payload

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=43200)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(request: Request, session: Session = Depends(get_session)):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # If you prefixed with Bearer somewhere else, strip it
    if token.startswith("Bearer "):
        token = token.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401)

    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=401)
    return user