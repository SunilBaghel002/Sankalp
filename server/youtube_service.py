# server/youtube_service.py
import os
import logging
from typing import List, Dict, Optional
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

logging.basicConfig(level=logging.INFO)


def search_habit_videos(
    query: str,
    max_results: int = 5,
    category: Optional[str] = None
) -> List[Dict]:
    """Search YouTube for habit-related videos"""
    try:
        # Enhance query based on category
        if category:
            category_queries = {
                "habits": f"{query} atomic habits routine",
                "motivation": f"{query} motivation discipline",
                "sleep": f"{query} sleep health routine",
                "productivity": f"{query} productivity habits",
                "mindfulness": f"{query} mindfulness meditation"
            }
            search_query = category_queries.get(category, query)
        else:
            search_query = query
        
        request = youtube.search().list(
            q=search_query,
            part='snippet',
            type='video',
            maxResults=max_results,
            videoDefinition='high',
            relevanceLanguage='en',
            safeSearch='strict'
        )
        
        response = request.execute()
        
        videos = []
        for item in response.get('items', []):
            video_id = item['id']['videoId']
            snippet = item['snippet']
            
            videos.append({
                'id': video_id,
                'title': snippet['title'],
                'description': snippet['description'][:200] + '...',
                'thumbnail': snippet['thumbnails']['high']['url'],
                'channel': snippet['channelTitle'],
                'published_at': snippet['publishedAt'],
                'url': f'https://www.youtube.com/watch?v={video_id}'
            })
        
        return videos
    except HttpError as e:
        logging.error(f"YouTube API error: {e}")
        return []
    except Exception as e:
        logging.error(f"Error searching videos: {str(e)}")
        return []


def get_video_details(video_id: str) -> Optional[Dict]:
    """Get detailed information about a specific video"""
    try:
        request = youtube.videos().list(
            part='snippet,contentDetails,statistics',
            id=video_id
        )
        
        response = request.execute()
        
        if not response.get('items'):
            return None
        
        item = response['items'][0]
        snippet = item['snippet']
        stats = item['statistics']
        
        return {
            'id': video_id,
            'title': snippet['title'],
            'description': snippet['description'],
            'thumbnail': snippet['thumbnails']['high']['url'],
            'channel': snippet['channelTitle'],
            'published_at': snippet['publishedAt'],
            'view_count': stats.get('viewCount', 0),
            'like_count': stats.get('likeCount', 0),
            'duration': item['contentDetails']['duration'],
            'url': f'https://www.youtube.com/watch?v={video_id}'
        }
    except Exception as e:
        logging.error(f"Error getting video details: {str(e)}")
        return None


def get_recommended_videos_for_habit(habit_name: str, max_results: int = 3) -> List[Dict]:
    """Get video recommendations for a specific habit"""
    # Curated searches for common habits
    habit_queries = {
        "meditation": "guided meditation for beginners",
        "exercise": "home workout routine",
        "reading": "how to build reading habit",
        "journaling": "journaling for beginners",
        "water": "hydration benefits health",
        "sleep": "improve sleep quality routine",
        "workout": "effective workout routine",
        "study": "effective study techniques",
        "yoga": "yoga for beginners morning"
    }
    
    # Find matching query or use habit name
    search_query = None
    for key, query in habit_queries.items():
        if key in habit_name.lower():
            search_query = query
            break
    
    if not search_query:
        search_query = f"how to build {habit_name} habit"
    
    return search_habit_videos(search_query, max_results)


def get_daily_video_recommendation(
    current_streak: int,
    completion_rate: float,
    time_of_day: str = "morning"
) -> Optional[Dict]:
    """Get personalized daily video recommendation"""
    try:
        # Choose query based on user's progress
        if completion_rate < 50:
            query = "how to stay motivated building habits"
        elif current_streak < 7:
            query = "building habits first week tips"
        elif current_streak < 21:
            query = "21 day habit formation"
        elif current_streak < 100:
            query = "maintaining long term habits"
        else:
            query = "advanced habit mastery"
        
        # Add time-based modifier
        if time_of_day == "morning":
            query += " morning routine"
        elif time_of_day == "evening":
            query += " evening routine"
        
        videos = search_habit_videos(query, max_results=1)
        return videos[0] if videos else None
    except Exception as e:
        logging.error(f"Error getting daily recommendation: {str(e)}")
        return None


def get_learning_path_videos(difficulty: str = "beginner") -> Dict:
    """Get structured learning path videos"""
    try:
        paths = {
            "beginner": [
                {"title": "Introduction", "query": "habit building basics for beginners"},
                {"title": "First Week", "query": "building habits first week"},
                {"title": "Consistency", "query": "habit consistency techniques"}
            ],
            "intermediate": [
                {"title": "21-Day Challenge", "query": "21 day habit challenge"},
                {"title": "Habit Stacking", "query": "habit stacking technique"},
                {"title": "Overcoming Plateaus", "query": "overcome habit plateau"}
            ],
            "advanced": [
                {"title": "Habit Mastery", "query": "atomic habits mastery"},
                {"title": "System Design", "query": "habit system design"},
                {"title": "Long-term Success", "query": "maintaining habits long term"}
            ]
        }
        
        path = paths.get(difficulty, paths["beginner"])
        
        result = {
            "difficulty": difficulty,
            "modules": []
        }
        
        for module in path:
            videos = search_habit_videos(module["query"], max_results=2)
            result["modules"].append({
                "title": module["title"],
                "videos": videos
            })
        
        return result
    except Exception as e:
        logging.error(f"Error getting learning path: {str(e)}")
        return {"difficulty": difficulty, "modules": []}


# Curated high-quality channels for habit building
RECOMMENDED_CHANNELS = [
    {
        "name": "Matt D'Avella",
        "focus": "Minimalism & Habits",
        "channel_id": "UCJ24N4O0bP7LGLBDvye7oCA"
    },
    {
        "name": "Thomas Frank",
        "focus": "Productivity",
        "channel_id": "UCG-KntY7aVnIGXYEBQvmBAQ"
    },
    {
        "name": "Better Ideas",
        "focus": "Self-Improvement",
        "channel_id": "UCtUId5WFnN82GdDy7DgaQ7w"
    }
]