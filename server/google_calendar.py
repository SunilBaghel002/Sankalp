# server/google_calendar.py
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import requests

load_dotenv()

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:5173/calendar/callback"

# Calendar scope
CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events']

logging.basicConfig(level=logging.INFO)


def get_calendar_auth_url(state: str = None) -> str:
    """Generate Google Calendar authorization URL"""
    try:
        # Build URL manually to have more control
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        
        params = {
            "client_id": CLIENT_ID,
            "redirect_uri": REDIRECT_URI,
            "response_type": "code",
            "scope": " ".join(CALENDAR_SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "include_granted_scopes": "false",  # Don't include previously granted scopes
        }
        
        if state:
            params["state"] = state
        
        # Build query string
        query_string = "&".join(f"{k}={requests.utils.quote(str(v))}" for k, v in params.items())
        auth_url = f"{base_url}?{query_string}"
        
        logging.info(f"✅ Generated calendar auth URL")
        return auth_url
        
    except Exception as e:
        logging.error(f"Error generating auth URL: {str(e)}")
        raise


def exchange_code_for_tokens(code: str) -> Dict[str, Any]:
    """Exchange authorization code for access tokens using requests"""
    try:
        logging.info(f"Exchanging code for tokens...")
        
        # Use requests directly instead of google-auth-oauthlib
        token_url = "https://oauth2.googleapis.com/token"
        
        data = {
            "code": code,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        
        response = requests.post(token_url, data=data)
        
        if response.status_code != 200:
            error_data = response.json()
            logging.error(f"Token exchange failed: {error_data}")
            raise Exception(error_data.get("error_description", error_data.get("error", "Unknown error")))
        
        token_data = response.json()
        
        tokens = {
            "token": token_data.get("access_token"),
            "refresh_token": token_data.get("refresh_token"),
            "token_uri": "https://oauth2.googleapis.com/token",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "scopes": token_data.get("scope", "").split(" "),
            "expiry": token_data.get("expires_in")
        }
        
        logging.info("✅ Successfully exchanged code for tokens")
        return tokens
        
    except Exception as e:
        logging.error(f"Error exchanging code: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    """Refresh the access token"""
    try:
        token_url = "https://oauth2.googleapis.com/token"
        
        data = {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
        
        response = requests.post(token_url, data=data)
        
        if response.status_code != 200:
            error_data = response.json()
            raise Exception(error_data.get("error_description", "Failed to refresh token"))
        
        token_data = response.json()
        
        return {
            "token": token_data.get("access_token"),
            "refresh_token": refresh_token,  # Keep the original refresh token
            "token_uri": "https://oauth2.googleapis.com/token",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "scopes": token_data.get("scope", "").split(" "),
        }
        
    except Exception as e:
        logging.error(f"Error refreshing token: {str(e)}")
        raise


def get_calendar_service(tokens: Dict[str, Any]):
    """Create Calendar API service"""
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        
        # Get fresh token if needed
        access_token = tokens.get("token")
        refresh_token = tokens.get("refresh_token")
        
        # Create credentials
        credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
        )
        
        service = build('calendar', 'v3', credentials=credentials)
        return service
        
    except Exception as e:
        logging.error(f"Error creating calendar service: {str(e)}")
        raise


def create_habit_reminder(
    service,
    habit_name: str,
    habit_time: str,
    habit_why: str,
    start_date: Optional[str] = None
) -> Dict[str, Any]:
    """Create recurring calendar event for habit reminder"""
    try:
        # Parse habit time (format: HH:MM)
        try:
            hour, minute = map(int, habit_time.split(':'))
        except:
            hour, minute = 9, 0  # Default to 9:00 AM
        
        # Set start date (today if not specified)
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
            except:
                start_dt = datetime.now()
        else:
            start_dt = datetime.now()
        
        # Set the time
        start_dt = start_dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        # If time has passed today, start tomorrow
        if start_dt < datetime.now():
            start_dt += timedelta(days=1)
            
        end_dt = start_dt + timedelta(minutes=15)
        
        event = {
            'summary': f'🎯 {habit_name}',
            'description': f'Daily habit reminder from Sankalp\n\n📝 Why: {habit_why}\n\n💪 Stay consistent! Complete this habit to build momentum.',
            'start': {
                'dateTime': start_dt.isoformat(),
                'timeZone': 'Asia/Kolkata',
            },
            'end': {
                'dateTime': end_dt.isoformat(),
                'timeZone': 'Asia/Kolkata',
            },
            'recurrence': [
                'RRULE:FREQ=DAILY;COUNT=100'
            ],
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 10},
                    {'method': 'popup', 'minutes': 0},
                ],
            },
            'colorId': '9'
        }
        
        event = service.events().insert(calendarId='primary', body=event).execute()
        
        logging.info(f"✅ Created calendar event for '{habit_name}'")
        return {
            "success": True,
            "event_id": event.get('id'),
            "link": event.get('htmlLink')
        }
        
    except Exception as e:
        logging.error(f"Error creating reminder for '{habit_name}': {str(e)}")
        return {"success": False, "error": str(e)}


def delete_habit_reminder(service, event_id: str) -> bool:
    """Delete a calendar event"""
    try:
        service.events().delete(calendarId='primary', eventId=event_id).execute()
        logging.info(f"✅ Deleted calendar event {event_id}")
        return True
    except Exception as e:
        logging.error(f"Error deleting event: {e}")
        return False


def get_upcoming_reminders(service, max_results: int = 10):
    """Get upcoming habit reminders from calendar"""
    try:
        now = datetime.utcnow().isoformat() + 'Z'
        
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime',
            q='🎯'
        ).execute()
        
        events = events_result.get('items', [])
        
        return [
            {
                'id': event['id'],
                'summary': event.get('summary', 'Habit Reminder'),
                'start': event['start'].get('dateTime', event['start'].get('date')),
                'description': event.get('description', ''),
                'link': event.get('htmlLink', '')
            }
            for event in events
        ]
        
    except Exception as e:
        logging.error(f"Error fetching events: {e}")
        return []