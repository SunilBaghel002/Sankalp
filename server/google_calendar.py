# server/google_calendar.py
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

load_dotenv()

# Google Calendar API configuration
SCOPES = ['https://www.googleapis.com/auth/calendar']
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_CALENDAR_REDIRECT_URI", "http://localhost:5173/calendar/callback")

logging.basicConfig(level=logging.INFO)

def get_calendar_auth_url(state: str = None) -> str:
    """Generate Google Calendar authorization URL"""
    try:
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [REDIRECT_URI]
                }
            },
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state,
            prompt='consent'
        )
        
        return auth_url
    except Exception as e:
        logging.error(f"Error generating auth URL: {str(e)}")
        raise


def exchange_code_for_tokens(code: str) -> Dict[str, Any]:
    """Exchange authorization code for access tokens"""
    try:
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [REDIRECT_URI]
                }
            },
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        return {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes
        }
    except Exception as e:
        logging.error(f"Error exchanging code: {str(e)}")
        raise


def get_calendar_service(tokens: Dict[str, Any]):
    """Create Calendar API service"""
    try:
        credentials = Credentials(
            token=tokens.get("token"),
            refresh_token=tokens.get("refresh_token"),
            token_uri=tokens.get("token_uri"),
            client_id=tokens.get("client_id"),
            client_secret=tokens.get("client_secret"),
            scopes=tokens.get("scopes")
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
        hour, minute = map(int, habit_time.split(':'))
        
        # Set start date (today if not specified)
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
        else:
            start_dt = datetime.now()
        
        # Set the time
        start_dt = start_dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
        end_dt = start_dt + timedelta(minutes=15)  # 15-minute reminder
        
        event = {
            'summary': f'🎯 {habit_name}',
            'description': f'Daily habit reminder\n\nWhy: {habit_why}\n\n💪 Stay consistent!',
            'start': {
                'dateTime': start_dt.isoformat(),
                'timeZone': 'Asia/Kolkata',
            },
            'end': {
                'dateTime': end_dt.isoformat(),
                'timeZone': 'Asia/Kolkata',
            },
            'recurrence': [
                'RRULE:FREQ=DAILY;COUNT=100'  # Repeat for 100 days
            ],
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 10},
                    {'method': 'notification', 'minutes': 30},
                ],
            },
            'colorId': '9'  # Blue color
        }
        
        event = service.events().insert(calendarId='primary', body=event).execute()
        
        logging.info(f"✅ Created calendar event for {habit_name}")
        return {
            "success": True,
            "event_id": event.get('id'),
            "link": event.get('htmlLink')
        }
    except HttpError as error:
        logging.error(f"Calendar API error: {error}")
        return {"success": False, "error": str(error)}
    except Exception as e:
        logging.error(f"Error creating reminder: {str(e)}")
        return {"success": False, "error": str(e)}


def delete_habit_reminder(service, event_id: str) -> bool:
    """Delete a calendar event"""
    try:
        service.events().delete(calendarId='primary', eventId=event_id).execute()
        logging.info(f"✅ Deleted calendar event {event_id}")
        return True
    except HttpError as error:
        logging.error(f"Error deleting event: {error}")
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
            q='🎯'  # Search for events with our habit emoji
        ).execute()
        
        events = events_result.get('items', [])
        
        return [
            {
                'id': event['id'],
                'summary': event['summary'],
                'start': event['start'].get('dateTime', event['start'].get('date')),
                'description': event.get('description', ''),
                'link': event.get('htmlLink')
            }
            for event in events
        ]
    except HttpError as error:
        logging.error(f"Error fetching events: {error}")
        return []