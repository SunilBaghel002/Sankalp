# server/rate_limiter.py
import time
from typing import Dict, Tuple
from fastapi import HTTPException, Request
from functools import wraps

# In-memory rate limit storage (use Redis in production)
_rate_limits: Dict[str, list] = {}


class RateLimiter:
    """Simple rate limiter"""
    
    def __init__(self, requests: int = 100, window: int = 60):
        self.requests = requests
        self.window = window  # seconds
    
    def is_allowed(self, key: str) -> Tuple[bool, int]:
        """Check if request is allowed"""
        now = time.time()
        
        if key not in _rate_limits:
            _rate_limits[key] = []
        
        # Clean old entries
        _rate_limits[key] = [t for t in _rate_limits[key] if now - t < self.window]
        
        if len(_rate_limits[key]) >= self.requests:
            # Rate limited
            oldest = _rate_limits[key][0]
            retry_after = int(self.window - (now - oldest))
            return False, retry_after
        
        # Allow request
        _rate_limits[key].append(now)
        remaining = self.requests - len(_rate_limits[key])
        return True, remaining


# Rate limiters for different endpoints
default_limiter = RateLimiter(requests=100, window=60)
auth_limiter = RateLimiter(requests=10, window=60)
ai_limiter = RateLimiter(requests=20, window=60)


def rate_limit(limiter: RateLimiter = default_limiter):
    """Rate limiting decorator"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get request from kwargs or args
            request = kwargs.get('request')
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            if request:
                # Use IP + endpoint as key
                client_ip = request.client.host if request.client else "unknown"
                key = f"{client_ip}:{request.url.path}"
                
                allowed, value = limiter.is_allowed(key)
                
                if not allowed:
                    raise HTTPException(
                        status_code=429,
                        detail=f"Rate limit exceeded. Retry after {value} seconds.",
                        headers={"Retry-After": str(value)}
                    )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator