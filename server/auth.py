# server/auth.py
import os
import logging
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, Request
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

logging.basicConfig(level=logging.INFO)


def verify_google_token(token: str) -> dict:
    """Verify Google OAuth token and return user info"""
    try:
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        return idinfo
    except ValueError as e:
        logging.error(f"Google token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid Google token")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def verify_access_token(token: str) -> dict:
    """Verify JWT access token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logging.error(f"JWT verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(request: Request):
    """Get current user from JWT token in cookie"""
    from database import supabase
    from models import User
    
    # Get token from cookie
    token = request.cookies.get("access_token")
    
    if not token:
        logging.warning("No access_token cookie found")
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Verify token
        payload = verify_access_token(token)
        
        user_id = payload.get("user_id")
        email = payload.get("sub")
        
        if not user_id and not email:
            logging.error("Token payload missing user_id and email")
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Fetch user from database
        try:
            if user_id:
                response = supabase.table('users').select('*').eq('id', user_id).single().execute()
            else:
                response = supabase.table('users').select('*').eq('email', email).single().execute()
            
            if not response.data:
                logging.error(f"User not found: user_id={user_id}, email={email}")
                raise HTTPException(status_code=401, detail="User not found")
            
            user = User.from_supabase(response.data)
            return user
            
        except Exception as db_error:
            logging.error(f"Database error fetching user: {str(db_error)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in get_current_user: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=401, detail="Authentication failed")