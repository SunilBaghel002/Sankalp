# server/youtube_service.py
import os
from googleapiclient.discovery import build
from typing import List, Optional
import logging

logging.basicConfig(level=logging.INFO)

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# Curated video playlists for different topics
CURATED_VIDEOS = {
    "habits": [
        {"id": "PZ7lDrwYdZc", "title": "Atomic Habits Summary", "channel": "Productivity Game"},
        {"id": "mNeXuCYiE0U", "title": "How to Build Good Habits", "channel": "Thomas Frank"},
        {"id": "Wcs2PFz5q6g", "title": "The Science of Habits", "channel": "AsapSCIENCE"},
    ],
    "motivation": [
        {"id": "mgmVOuLgFB0", "title": "Dream - Motivational Video", "channel": "Mateusz M"},
        {"id": "g-jwWYX7Jlo", "title": "UNBROKEN - Motivational Video", "channel": "Absolute Motivation"},
    ],
    "sleep": [
        {"id": "5MuIMqhT8DM", "title": "Why We Sleep", "channel": "TED"},
        {"id": "pwaWilO_Pig", "title": "Sleep is Your Superpower", "channel": "TED"},
    ],
    "productivity": [
        {"id": "IlU-zDU6aQ0", "title": "The One Thing Book Summary", "channel": "Productivity Game"},
        {"id": "arj7oStGLkU", "title": "How to Get More Done", "channel": "TED"},
    ],
    "mindfulness": [
        {"id": "inpok4MKVLM", "title": "How to Practice Mindfulness", "channel": "Headspace"},
        {"id": "w6T02g5hnT4", "title": "The Power of Mindfulness", "channel": "TED"},
    ]
}


def get_youtube_service():
    """Get YouTube API service"""
    if not YOUTUBE_API_KEY:
        logging.warning("⚠️ YOUTUBE_API_KEY not set")
        return None
    return build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)


def search_habit_videos(
    query: str = "habit building tips",
    max_results: int = 5,
    category: str = None
) -> List[dict]:
    """Search for habit-related videos on YouTube"""
    
    # If category specified and we have curated videos, return those
    if category and category in CURATED_VIDEOS:
        return CURATED_VIDEOS[category][:max_results]
    
    youtube = get_youtube_service()
    if not youtube:
        # Return curated fallback videos
        all_videos = []
        for videos in CURATED_VIDEOS.values():
            all_videos.extend(videos)
        return all_videos[:max_results]
    
    try:
        # Add habit-related keywords to query
        search_query = f"{query} habits motivation self-improvement"
        
        search_response = youtube.search().list(
            q=search_query,
            part='snippet',
            maxResults=max_results,
            type='video',
            videoDuration='medium',  # 4-20 minutes
            safeSearch='strict',
            relevanceLanguage='en',
            order='relevance'
        ).execute()
        
        videos = []
        for item in search_response.get('items', []):
            videos.append({
                'id': item['id']['videoId'],
                'title': item['snippet']['title'],
                'description': item['snippet']['description'][:200],
                'thumbnail': item['snippet']['thumbnails']['medium']['url'],
                'channel': item['snippet']['channelTitle'],
                'published_at': item['snippet']['publishedAt']
            })
        
        return videos
    except Exception as e:
        logging.error(f"Error searching YouTube: {str(e)}")
        # Return fallback curated videos
        return CURATED_VIDEOS.get('habits', [])[:max_results]


def get_video_details(video_id: str) -> Optional[dict]:
    """Get detailed information about a specific video"""
    
    youtube = get_youtube_service()
    if not youtube:
        return None
    
    try:
        video_response = youtube.videos().list(
            part='snippet,contentDetails,statistics',
            id=video_id
        ).execute()
        
        if not video_response.get('items'):
            return None
        
        video = video_response['items'][0]
        
        return {
            'id': video_id,
            'title': video['snippet']['title'],
            'description': video['snippet']['description'],
            'thumbnail': video['snippet']['thumbnails']['high']['url'],
            'channel': video['snippet']['channelTitle'],
            'duration': video['contentDetails']['duration'],
            'views': video['statistics'].get('viewCount', 0),
            'likes': video['statistics'].get('likeCount', 0),
            'embed_url': f"https://www.youtube.com/embed/{video_id}"
        }
    except Exception as e:
        logging.error(f"Error getting video details: {str(e)}")
        return None


def get_recommended_videos_for_habit(habit_name: str, max_results: int = 3) -> List[dict]:
    """Get video recommendations based on habit name"""
    
    # Map common habits to categories
    habit_keywords = {
        'exercise': ['workout', 'fitness', 'exercise habits'],
        'meditation': ['meditation', 'mindfulness', 'calm'],
        'reading': ['reading habits', 'how to read more', 'book habits'],
        'sleep': ['sleep better', 'sleep habits', 'sleep hygiene'],
        'water': ['hydration', 'drinking water habits'],
        'journal': ['journaling', 'daily journal', 'gratitude journal'],
        'study': ['study habits', 'learning', 'productivity'],
        'wake': ['morning routine', 'wake up early', 'morning habits'],
    }
    
    # Find matching keywords
    search_terms = []
    habit_lower = habit_name.lower()
    
    for key, terms in habit_keywords.items():
        if key in habit_lower:
            search_terms.extend(terms)
            break
    
    if not search_terms:
        search_terms = [f"{habit_name} habit tips"]
    
    return search_habit_videos(
        query=search_terms[0],
        max_results=max_results
    )


def get_daily_video_recommendation(
    current_streak: int = 0,
    completion_rate: float = 0,
    time_of_day: str = "morning"
) -> dict:
    """Get a personalized daily video recommendation"""
    
    # Select category based on context
    if completion_rate < 50:
        category = "motivation"
    elif time_of_day == "morning":
        category = "productivity"
    elif time_of_day == "evening":
        category = "mindfulness"
    else:
        category = "habits"
    
    videos = CURATED_VIDEOS.get(category, CURATED_VIDEOS['habits'])
    
    # Rotate based on streak to avoid repetition
    video_index = current_streak % len(videos)
    selected_video = videos[video_index]
    
    return {
        **selected_video,
        'category': category,
        'embed_url': f"https://www.youtube.com/embed/{selected_video['id']}",
        'watch_url': f"https://www.youtube.com/watch?v={selected_video['id']}"
    }


def get_learning_path_videos(difficulty: str = "beginner") -> dict:
    """Get a structured learning path of videos"""
    
    learning_paths = {
        "beginner": {
            "title": "Habit Building 101",
            "description": "Start your habit journey with these foundational videos",
            "videos": [
                {
                    "week": 1,
                    "topic": "Understanding Habits",
                    "videos": CURATED_VIDEOS['habits'][:2]
                },
                {
                    "week": 2,
                    "topic": "Building Motivation",
                    "videos": CURATED_VIDEOS['motivation'][:2]
                },
                {
                    "week": 3,
                    "topic": "Sleep & Recovery",
                    "videos": CURATED_VIDEOS['sleep'][:2]
                },
                {
                    "week": 4,
                    "topic": "Productivity Systems",
                    "videos": CURATED_VIDEOS['productivity'][:2]
                }
            ]
        },
        "intermediate": {
            "title": "Advanced Habit Mastery",
            "description": "Take your habits to the next level",
            "videos": [
                {
                    "week": 1,
                    "topic": "Habit Stacking",
                    "videos": search_habit_videos("habit stacking", 2)
                },
                {
                    "week": 2,
                    "topic": "Environment Design",
                    "videos": search_habit_videos("environment design habits", 2)
                }
            ]
        }
    }
    
    return learning_paths.get(difficulty, learning_paths["beginner"])