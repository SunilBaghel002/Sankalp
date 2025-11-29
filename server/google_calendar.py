# server/google_calendar.py
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:5173/calendar/callback"

# ✅ Use less sensitive scope - only events access instead of full calendar
SCOPES = ['https://www.googleapis.com/auth/calendar.events']

logging.basicConfig(level=logging.INFO)


def get_calendar_auth_url(state: str = None) -> str:
    """Generate Google Calendar authorization URL"""
    try:
        from google_auth_oauthlib.flow import Flow
        
        logging.info(f"Creating OAuth flow with redirect_uri: {REDIRECT_URI}")
        logging.info(f"Using scopes: {SCOPES}")
        
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
        
        logging.info(f"✅ Generated auth URL successfully")
        return auth_url
        
    except ImportError as e:
        logging.error(f"Missing dependency: {str(e)}")
        raise Exception("Calendar dependencies not installed. Run: pip install google-auth-oauthlib google-api-python-client")
    except Exception as e:
        logging.error(f"Error generating auth URL: {str(e)}")
        raise


def exchange_code_for_tokens(code: str) -> Dict[str, Any]:
    """Exchange authorization code for access tokens"""
    try:
        from google_auth_oauthlib.flow import Flow
        
        logging.info(f"Exchanging code for tokens with redirect_uri: {REDIRECT_URI}")
        
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
        
        tokens = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": list(credentials.scopes) if credentials.scopes else SCOPES
        }
        
        logging.info("✅ Successfully exchanged code for tokens")
        return tokens
        
    except Exception as e:
        logging.error(f"Error exchanging code: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_calendar_service(tokens: Dict[str, Any]):
    """Create Calendar API service"""
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        
        credentials = Credentials(
            token=tokens.get("token"),
            refresh_token=tokens.get("refresh_token"),
            token_uri=tokens.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=tokens.get("client_id", CLIENT_ID),
            client_secret=tokens.get("client_secret", CLIENT_SECRET),
            scopes=tokens.get("scopes", SCOPES)
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
        try:
            hour, minute = map(int, habit_time.split(':'))
        except:
            hour, minute = 9, 0
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
            except:
                start_dt = datetime.now()
        else:
            start_dt = datetime.now()
        
        start_dt = start_dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        if start_dt < datetime.now():
            start_dt += timedelta(days=1)
            
        end_dt = start_dt + timedelta(minutes=15)
        
        event = {
            'summary': f'🎯 {habit_name}',
            'description': f'Daily habit reminder from Sankalp\n\n📝 Why: {habit_why}\n\n💪 Stay consistent!',
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