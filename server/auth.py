# server/auth.py
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import logging

from database import supabase
from models import User

# Setup
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 30

security = HTTPBearer(auto_error=False)

def verify_google_token(token: str) -> dict:
    """Verify Google OAuth token"""
    try:
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        return idinfo
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def create_access_token(data: dict) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=JWT_EXPIRATION_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> dict:
    """Verify JWT access token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_current_user(request: Request) -> User:
    """Get current user from JWT token in cookie"""
    # Try to get token from cookie
    token = request.cookies.get("access_token")
    
    if not token:
        # Try Authorization header as fallback
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = verify_access_token(token)
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Get user from database
        response = supabase.table('users').select('*').eq('id', user_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # ✅ Use the from_supabase method which handles None values
        return User.from_supabase(response.data)
        
    except JWTError as e:
        logging.error(f"JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        logging.error(f"Auth Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")