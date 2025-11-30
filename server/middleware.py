# server/middleware.py
import logging
import time
import traceback
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logging.basicConfig(level=logging.INFO)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Global error handling and logging"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        try:
            response = await call_next(request)
            
            # Log request
            process_time = time.time() - start_time
            logging.info(
                f"{request.method} {request.url.path} - "
                f"Status: {response.status_code} - "
                f"Time: {process_time:.3f}s"
            )
            
            return response
            
        except HTTPException as e:
            # Re-raise HTTP exceptions
            raise
            
        except Exception as e:
            # Log unexpected errors
            process_time = time.time() - start_time
            logging.error(
                f"{request.method} {request.url.path} - "
                f"Error: {str(e)} - "
                f"Time: {process_time:.3f}s"
            )
            logging.error(traceback.format_exc())
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal server error",
                    "message": "An unexpected error occurred. Please try again later."
                }
            )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests with details"""
    
    async def dispatch(self, request: Request, call_next):
        # Log request 