# server/cache.py
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Optional
from functools import wraps
import hashlib

logging.basicConfig(level=logging.INFO)

# Simple in-memory cache (use Redis in production)
_cache = {}
_cache_ttl = {}


def cache_key(*args, **kwargs) -> str:
    """Generate cache key from arguments"""
    key_data = json.dumps({'args': args, 'kwargs': kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_data.encode()).hexdigest()


def get_cache(key: str) -> Optional[Any]:
    """Get value from cache"""
    if key in _cache:
        if datetime.now() < _cache_ttl.get(key, datetime.min):
            return _cache[key]
        else:
            # Expired
            del _cache[key]
            del _cache_ttl[key]
    return None


def set_cache(key: str, value: Any, ttl_seconds: int = 300):
    """Set value in cache"""
    _cache[key] = value
    _cache_ttl[key] = datetime.now() + timedelta(seconds=ttl_seconds)


def invalidate_cache(pattern: str = None):
    """Invalidate cache entries"""
    if pattern:
        keys_to_delete = [k for k in _cache.keys() if pattern in k]
        for k in keys_to_delete:
            del _cache[k]
            if k in _cache_ttl:
                del _cache_ttl[k]
    else:
        _cache.clear()
        _cache_ttl.clear()


def cached(ttl_seconds: int = 300, key_prefix: str = ""):
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            key = f"{key_prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Check cache
            cached_value = get_cache(key)
            if cached_value is not None:
                logging.debug(f"Cache hit: {key}")
                return cached_value
            
            # Call function
            result = await func(*args, **kwargs)
            
            # Cache result
            set_cache(key, result, ttl_seconds)
            logging.debug(f"Cache set: {key}")
            
            return result
        return wrapper
    return decorator