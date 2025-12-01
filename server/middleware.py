# server/middleware.py
import os
import time
import logging
from typing import Callable, Dict, Any, Optional
from functools import wraps
from datetime import datetime, timedelta
from collections import defaultdict
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from cachetools import TTLCache
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)

# ============================================
# IN-MEMORY CACHE
# ============================================

class InMemoryCache:
    """Simple in-memory cache with TTL"""
    
    def __init__(self, maxsize: int = 1000, ttl: int = 300):
        self.cache = TTLCache(maxsize=maxsize, ttl=ttl)
        self.stats = {"hits": 0, "misses": 0}
    
    def get(self, key: str) -> Optional[Any]:
        value = self.cache.get(key)
        if value is not None:
            self.stats["hits"] += 1
            return value
        self.stats["misses"] += 1
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        self.cache[key] = value
    
    def delete(self, key: str) -> None:
        self.cache.pop(key, None)
    
    def clear(self) -> None:
        self.cache.clear()
    
    def get_stats(self) -> Dict[str, int]:
        return {
            **self.stats,
            "size": len(self.cache),
            "hit_rate": self.stats["hits"] / max(1, self.stats["hits"] + self.stats["misses"]) * 100
        }


# Global cache instance
cache = InMemoryCache(maxsize=2000, ttl=300)  # 5 minutes default TTL


def cached(ttl: int = 300, key_prefix: str = ""):
    """Decorator to cache function results"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Call function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator


def invalidate_cache(pattern: str = None):
    """Invalidate cache entries matching pattern"""
    if pattern is None:
        cache.clear()
    else:
        # Simple pattern matching (keys starting with pattern)
        keys_to_delete = [k for k in cache.cache.keys() if k.startswith(pattern)]
        for key in keys_to_delete:
            cache.delete(key)


# ============================================
# RATE LIMITER
# ============================================

class RateLimiter:
    """Token bucket rate limiter"""
    
    def __init__(self):
        self.requests: Dict[str, list] = defaultdict(list)
        self.blocked_ips: Dict[str, datetime] = {}
        
        # Default limits
        self.default_limit = 100  # requests
        self.default_window = 60  # seconds
        
        # Endpoint-specific limits
        self.endpoint_limits = {
            "/auth/": {"limit": 10, "window": 60},
            "/ai/": {"limit": 20, "window": 60},
            "/push/": {"limit": 30, "window": 60},
            "/checkins": {"limit": 60, "window": 60},
        }
    
    def _get_limit_for_path(self, path: str) -> tuple:
        """Get rate limit for a specific path"""
        for prefix, limits in self.endpoint_limits.items():
            if path.startswith(prefix):
                return limits["limit"], limits["window"]
        return self.default_limit, self.default_window
    
    def _clean_old_requests(self, key: str, window: int):
        """Remove requests outside the window"""
        now = time.time()
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if now - req_time < window
        ]
    
    def is_blocked(self, ip: str) -> bool:
        """Check if IP is temporarily blocked"""
        if ip in self.blocked_ips:
            if datetime.now() < self.blocked_ips[ip]:
                return True
            else:
                del self.blocked_ips[ip]
        return False
    
    def block_ip(self, ip: str, duration_minutes: int = 15):
        """Temporarily block an IP"""
        self.blocked_ips[ip] = datetime.now() + timedelta(minutes=duration_minutes)
    
    def check_rate_limit(self, ip: str, path: str) -> tuple:
        """
        Check if request is within rate limit.
        Returns (allowed: bool, remaining: int, reset_time: int)
        """
        if self.is_blocked(ip):
            return False, 0, 900  # 15 minutes
        
        limit, window = self._get_limit_for_path(path)
        key = f"{ip}:{path}"
        
        self._clean_old_requests(key, window)
        
        current_requests = len(self.requests[key])
        
        if current_requests >= limit:
            # Check for abuse (hitting limit repeatedly)
            if current_requests > limit * 2:
                self.block_ip(ip)
            return False, 0, window
        
        self.requests[key].append(time.time())
        remaining = limit - current_requests - 1
        
        return True, remaining, window


# Global rate limiter instance
rate_limiter = RateLimiter()


# ============================================
# MIDDLEWARES
# ============================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce rate limiting"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for certain paths
        skip_paths = ["/docs", "/openapi.json", "/redoc", "/health"]
        if any(request.url.path.startswith(p) for p in skip_paths):
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        # Check rate limit
        allowed, remaining, reset_time = rate_limiter.check_rate_limit(
            client_ip, request.url.path
        )
        
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too Many Requests",
                    "message": "Rate limit exceeded. Please try again later.",
                    "retry_after": reset_time
                },
                headers={
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_time),
                    "Retry-After": str(reset_time)
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_time)
        
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Get client info
        client_ip = request.client.host if request.client else "unknown"
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log request
            log_level = logging.WARNING if response.status_code >= 400 else logging.INFO
            logging.log(
                log_level,
                f"{request.method} {request.url.path} - {response.status_code} - {duration:.3f}s - {client_ip}"
            )
            
            # Add timing header
            response.headers["X-Response-Time"] = f"{duration:.3f}s"
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            logging.error(
                f"{request.method} {request.url.path} - ERROR - {duration:.3f}s - {client_ip} - {str(e)}"
            )
            raise


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Unhandled error: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "message": "An unexpected error occurred. Please try again.",
                    "request_id": str(time.time())
                }
            )


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response