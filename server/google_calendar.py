# server/google_calendar.py
import os
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import logging

logging.basicConfig(level=logging.INFO)

# Google Calendar API Scopes
SCOPES = ['https://www.googleapis.com/auth/calendar.events']

# OAuth 2.0 Client Configuration
CLIENT_CONFIG = {
    "web": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "redirect_uris": ["http://localhost:5173/auth/calendar/callback"],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
    }
}


def get_calendar_auth_url(state: str = None) -> str:
    """Generate Google Calendar authorization URL"""
    flow = Flow.from_client_config(
        CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri="http://localhost:5173/auth/calendar/callback"
    )
    
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=state,
        prompt='consent'
    )
    
    return auth_url


def exchange_code_for_tokens(code: str) -> dict:
    """Exchange authorization code for tokens"""
    flow = Flow.from_client_config(
        CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri="http://localhost:5173/auth/calendar/callback"
    )
    
    flow.fetch_token(code=code)
    credentials = flow.credentials
    
    return {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "expiry": credentials.expiry.isoformat() if credentials.expiry else None
    }


def get_calendar_service(token_data: dict):
    """Get Google Calendar service with user credentials"""
    credentials = Credentials(
        token=token_data.get("token"),
        refresh_token=token_data.get("refresh_token"),
        token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=token_data.get("client_id", os.getenv("GOOGLE_CLIENT_ID")),
        client_secret=token_data.get("client_secret", os.getenv("GOOGLE_CLIENT_SECRET"))
    )
    
    return build('calendar', 'v3', credentials=credentials)


def create_habit_reminder(
    service,
    habit_name: str,
    habit_time: str,
    habit_why: str,
    start_date: str = None,
    recurrence_days: int = 100
) -> dict:
    """Create a recurring calendar event for a habit"""
    
    if not start_date:
        start_date = datetime.now().strftime('%Y-%m-%d')
    
    # Parse habit time (HH:MM format)
    hour, minute = map(int, habit_time.split(':'))
    
    # Create start and end datetime
    start_datetime = datetime.strptime(start_date, '%Y-%m-%d').replace(hour=hour, minute=minute)
    end_datetime = start_datetime + timedelta(minutes=30)  # 30 min duration
    
    # Calculate end date for recurrence
    end_recurrence = start_datetime + timedelta(days=recurrence_days)
    
    event = {
        'summary': f'🎯 Habit: {habit_name}',
        'description': f'''
🔥 Sankalp Habit Reminder

📌 Habit: {habit_name}
💡 Why: {habit_why}

Remember: You have ₹500 at stake! Complete your habit to stay on track.

"Success is the sum of small efforts repeated day in and day out."
        ''',
        'start': {
            'dateTime': start_datetime.isoformat(),
            'timeZone': 'Asia/Kolkata',
        },
        'end': {
            'dateTime': end_datetime.isoformat(),
            'timeZone': 'Asia/Kolkata',
        },
        'recurrence': [
            f'RRULE:FREQ=DAILY;UNTIL={end_recurrence.strftime("%Y%m%dT235959Z")}'
        ],
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'popup', 'minutes': 10},
                {'method': 'popup', 'minutes': 0},
            ],
        },
        'colorId': '6',  # Orange color
    }
    
    try:
        created_event = service.events().insert(
            calendarId='primary',
            body=event
        ).execute()
        
        logging.info(f"✅ Created calendar event: {created_event.get('id')}")
        return {
            "success": True,
            "event_id": created_event.get('id'),
            "event_link": created_event.get('htmlLink')
        }
    except HttpError as error:
        logging.error(f"Error creating calendar event: {error}")
        return {
            "success": False,
            "error": str(error)
        }


def delete_habit_reminder(service, event_id: str) -> bool:
    """Delete a calendar event"""
    try:
        service.events().delete(
            calendarId='primary',
            eventId=event_id
        ).execute()
        logging.info(f"✅ Deleted calendar event: {event_id}")
        return True
    except HttpError as error:
        logging.error(f"Error deleting calendar event: {error}")
        return False


def update_habit_reminder(
    service,
    event_id: str,
    habit_name: str = None,
    habit_time: str = None,
    habit_why: str = None
) -> dict:
    """Update an existing calendar event"""
    try:
        # Get existing event
        event = service.events().get(
            calendarId='primary',
            eventId=event_id
        ).execute()
        
        # Update fields
        if habit_name:
            event['summary'] = f'🎯 Habit: {habit_name}'
        
        if habit_why:
            event['description'] = f'''
🔥 Sankalp Habit Reminder

📌 Habit: {habit_name or event.get('summary', '').replace('🎯 Habit: ', '')}
💡 Why: {habit_why}

Remember: You have ₹500 at stake! Complete your habit to stay on track.
            '''
        
        if habit_time:
            hour, minute = map(int, habit_time.split(':'))
            start = datetime.fromisoformat(event['start']['dateTime'].replace('Z', '+00:00'))
            start = start.replace(hour=hour, minute=minute)
            end = start + timedelta(minutes=30)
            event['start']['dateTime'] = start.isoformat()
            event['end']['dateTime'] = end.isoformat()
        
        updated_event = service.events().update(
            calendarId='primary',
            eventId=event_id,
            body=event
        ).execute()
        
        return {
            "success": True,
            "event_id": updated_event.get('id')
        }
    except HttpError as error:
        logging.error(f"Error updating calendar event: {error}")
        return {
            "success": False,
            "error": str(error)
        }


def get_upcoming_reminders(service, max_results: int = 10) -> list:
    """Get upcoming habit reminders from calendar"""
    try:
        now = datetime.utcnow().isoformat() + 'Z'
        
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime',
            q='Sankalp Habit'  # Search for our habit events
        ).execute()
        
        events = events_result.get('items', [])
        
        return [{
            'id': event['id'],
            'summary': event['summary'],
            'start': event['start'].get('dateTime', event['start'].get('date')),
            'link': event.get('htmlLink')
        } for event in events]
    except HttpError as error:
        logging.error(f"Error fetching calendar events: {error}")
        return []