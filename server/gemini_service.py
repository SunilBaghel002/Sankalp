# server/gemini_service.py
import os
import google.generativeai as genai
from typing import List, Optional
import logging
import json
import random

logging.basicConfig(level=logging.INFO)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    model = None
    logging.warning("⚠️ GEMINI_API_KEY not set. AI features will be disabled.")


# Fallback content when API is unavailable
FALLBACK_QUOTES = [
    {"quote": "Success is the sum of small efforts repeated day in and day out.", "author": "Robert Collier"},
    {"quote": "The secret of getting ahead is getting started.", "author": "Mark Twain"},
    {"quote": "It's not about being the best. It's about being better than you were yesterday.", "author": "Anonymous"},
    {"quote": "Habits are the compound interest of self-improvement.", "author": "James Clear"},
    {"quote": "We are what we repeatedly do. Excellence is not an act, but a habit.", "author": "Aristotle"},
    {"quote": "The only way to do great work is to love what you do.", "author": "Steve Jobs"},
    {"quote": "Don't watch the clock; do what it does. Keep going.", "author": "Sam Levenson"},
    {"quote": "Small daily improvements are the key to staggering long-term results.", "author": "Anonymous"},
]

FALLBACK_TIPS = [
    "Start with just 2 minutes. Any habit can be started in 2 minutes or less.",
    "Stack your new habit on top of an existing one. After [current habit], I will [new habit].",
    "Design your environment for success. Make good habits obvious and bad habits invisible.",
    "Track your habits. What gets measured gets managed.",
    "Never miss twice. If you miss one day, get back on track immediately.",
    "Celebrate small wins. Reward yourself for completing your habits.",
    "Find an accountability partner. Share your goals with someone who will check in on you.",
    "Focus on systems, not goals. Fall in love with the process of becoming better.",
]


async def generate_motivational_quote(
    user_name: str = "Friend",
    current_streak: int = 0,
    habits_completed_today: int = 0,
    total_habits: int = 5
) -> dict:
    """Generate a personalized motivational quote"""
    
    if not model:
        quote = random.choice(FALLBACK_QUOTES)
        return {
            "quote": quote["quote"],
            "author": quote["author"],
            "personalized_message": f"Keep going, {user_name}! You're on a {current_streak}-day streak! 🔥"
        }
    
    try:
        prompt = f"""
Generate an inspiring and motivational quote for someone working on building better habits.

Context:
- User's name: {user_name}
- Current streak: {current_streak} days
- Habits completed today: {habits_completed_today} out of {total_habits}
- They have ₹500 at stake if they fail

Please provide:
1. A unique motivational quote (not commonly known)
2. The author (can be "Anonymous" if original)
3. A personalized message for this user based on their progress

Format your response as JSON:
{{
    "quote": "the quote here",
    "author": "author name",
    "personalized_message": "personalized encouragement"
}}
"""
        
        response = model.generate_content(prompt)
        
        # Parse JSON response
        try:
            result = json.loads(response.text)
            return result
        except json.JSONDecodeError:
            # If JSON parsing fails, return the text as a quote
            return {
                "quote": response.text.strip(),
                "author": "AI Generated",
                "personalized_message": f"Keep pushing, {user_name}!"
            }
    except Exception as e:
        logging.error(f"Error generating quote: {str(e)}")
        quote = random.choice(FALLBACK_QUOTES)
        return {
            "quote": quote["quote"],
            "author": quote["author"],
            "personalized_message": f"Stay strong, {user_name}! Every day counts! 💪"
        }


async def generate_habit_tips(
    habits: List[dict],
    completion_rate: float = 0,
    weak_habits: List[str] = None
) -> dict:
    """Generate personalized habit tips based on user's habits and performance"""
    
    if not model:
        return {
            "tips": random.sample(FALLBACK_TIPS, min(3, len(FALLBACK_TIPS))),
            "focus_area": "consistency",
            "weekly_challenge": "Complete all habits for 7 consecutive days!"
        }
    
    try:
        habit_names = [h.get('name', '') for h in habits]
        weak_habit_list = weak_habits or []
        
        prompt = f"""
You are a habit coach. Generate personalized tips for someone building these habits:

Habits: {', '.join(habit_names)}
Current completion rate: {completion_rate}%
Struggling with: {', '.join(weak_habit_list) if weak_habit_list else 'None specifically'}

Provide:
1. 3 specific, actionable tips to improve their habit success
2. One focus area for the week
3. A fun weekly challenge

Format as JSON:
{{
    "tips": ["tip1", "tip2", "tip3"],
    "focus_area": "area to focus on",
    "weekly_challenge": "a fun challenge",
    "encouragement": "a short encouraging message"
}}
"""
        
        response = model.generate_content(prompt)
        
        try:
            result = json.loads(response.text)
            return result
        except json.JSONDecodeError:
            return {
                "tips": [response.text.strip()],
                "focus_area": "consistency",
                "weekly_challenge": "Complete all habits for 7 days straight!"
            }
    except Exception as e:
        logging.error(f"Error generating tips: {str(e)}")
        return {
            "tips": random.sample(FALLBACK_TIPS, 3),
            "focus_area": "building momentum",
            "weekly_challenge": "Don't break the chain for 7 days!"
        }


async def generate_sleep_insights(
    average_sleep: float,
    sleep_pattern: List[dict],
    habit_completion_rate: float
) -> dict:
    """Generate insights about sleep patterns and their impact on habits"""
    
    if not model:
        if average_sleep >= 7:
            message = "Great sleep habits! You're getting adequate rest."
        elif average_sleep >= 6:
            message = "You're close to optimal sleep. Try adding 30 more minutes."
        else:
            message = "Your sleep might be affecting your habit performance. Prioritize rest!"
        
        return {
            "insight": message,
            "recommendation": "Aim for 7-8 hours of sleep for optimal performance.",
            "correlation": "Studies show good sleep improves habit adherence by up to 30%."
        }
    
    try:
        prompt = f"""
Analyze this sleep data and provide insights:

Average sleep: {average_sleep} hours
Recent sleep pattern: {json.dumps(sleep_pattern[-7:] if len(sleep_pattern) > 7 else sleep_pattern)}
Habit completion rate: {habit_completion_rate}%

Provide:
1. A key insight about their sleep
2. One actionable recommendation
3. How sleep might be affecting their habits

Format as JSON:
{{
    "insight": "main insight",
    "recommendation": "specific recommendation",
    "correlation": "how sleep affects their habits",
    "sleep_score": 1-10 rating
}}
"""
        
        response = model.generate_content(prompt)
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            return {
                "insight": response.text.strip()[:200],
                "recommendation": "Maintain consistent sleep and wake times.",
                "correlation": "Better sleep = better habits!",
                "sleep_score": 7
            }
    except Exception as e:
        logging.error(f"Error generating sleep insights: {str(e)}")
        return {
            "insight": f"You're averaging {average_sleep} hours of sleep.",
            "recommendation": "Try to maintain a consistent sleep schedule.",
            "correlation": "Good sleep supports habit success!",
            "sleep_score": min(10, int(average_sleep))
        }


async def generate_daily_affirmation(user_name: str, day_number: int) -> str:
    """Generate a daily affirmation for the user"""
    
    affirmations = [
        f"Day {day_number}: {user_name}, you are building the life you deserve, one habit at a time.",
        f"Day {day_number}: Every small step you take today brings you closer to your goals.",
        f"Day {day_number}: {user_name}, your consistency is your superpower!",
        f"Day {day_number}: You've already proven you can do this. Keep going!",
        f"Day {day_number}: Today is another opportunity to become the best version of yourself.",
    ]
    
    if not model:
        return random.choice(affirmations)
    
    try:
        prompt = f"""
Generate a unique, powerful daily affirmation for {user_name} who is on day {day_number} of their 100-day habit challenge.
Keep it personal, motivating, and under 50 words.
Start with "Day {day_number}:"
"""
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logging.error(f"Error generating affirmation: {str(e)}")
        return random.choice(affirmations)


async def generate_thought_reflection(thought: str, date: str) -> dict:
    """Generate a reflection on user's daily thought"""
    
    if not model:
        return {
            "reflection": "That's a wonderful thought to carry with you!",
            "related_quote": random.choice(FALLBACK_QUOTES)["quote"],
            "action_item": "Try to apply this thought in one interaction today."
        }
    
    try:
        prompt = f"""
The user recorded this positive thought for {date}:
"{thought}"

Provide:
1. A brief, encouraging reflection on their thought (2-3 sentences)
2. A related inspirational quote
3. A small action item to apply this thought

Format as JSON:
{{
    "reflection": "your reflection",
    "related_quote": "a related quote",
    "action_item": "small action to take"
}}
"""
        
        response = model.generate_content(prompt)
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            return {
                "reflection": response.text.strip()[:200],
                "related_quote": "Every positive thought is a seed for a better tomorrow.",
                "action_item": "Share this thought with someone today."
            }
    except Exception as e:
        logging.error(f"Error generating reflection: {str(e)}")
        return {
            "reflection": "What a meaningful thought to start your day!",
            "related_quote": "Your thoughts shape your reality.",
            "action_item": "Reflect on this thought during a quiet moment today."
        }


async def generate_weekly_report(
    user_name: str,
    habits: List[dict],
    weekly_stats: dict,
    sleep_data: List[dict],
    thoughts: List[str]
) -> dict:
    """Generate a comprehensive weekly report with AI insights"""
    
    if not model:
        return {
            "summary": f"Great week, {user_name}! You completed {weekly_stats.get('completed_days', 0)} perfect days.",
            "highlights": ["Maintained consistency", "Tracked your sleep", "Recorded daily thoughts"],
            "areas_to_improve": ["Try to complete all habits daily"],
            "next_week_focus": "Build on your momentum!",
            "motivational_message": "Every week you're getting stronger! 💪"
        }
    
    try:
        prompt = f"""
Generate a weekly habit report for {user_name}:

Weekly Stats:
- Perfect days: {weekly_stats.get('perfect_days', 0)}/7
- Average completion: {weekly_stats.get('avg_completion', 0)}%
- Current streak: {weekly_stats.get('current_streak', 0)} days

Habits: {[h.get('name') for h in habits]}

Average sleep: {sum([s.get('hours', 0) for s in sleep_data]) / max(len(sleep_data), 1):.1f} hours

Number of thoughts recorded: {len(thoughts)}

Generate a comprehensive, encouraging weekly report with:
1. A personalized summary (2-3 sentences)
2. 3 highlights/wins from the week
3. 2 areas to improve (be gentle but honest)
4. A focus for next week
5. An inspiring closing message

Format as JSON:
{{
    "summary": "personalized summary",
    "highlights": ["highlight1", "highlight2", "highlight3"],
    "areas_to_improve": ["area1", "area2"],
    "next_week_focus": "focus area",
    "motivational_message": "closing message"
}}
"""
        
        response = model.generate_content(prompt)
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            return {
                "summary": response.text.strip()[:300],
                "highlights": ["You showed up this week!"],
                "areas_to_improve": ["Keep pushing forward"],
                "next_week_focus": "Consistency",
                "motivational_message": "You're doing amazing! 🌟"
            }
    except Exception as e:
        logging.error(f"Error generating weekly report: {str(e)}")
        return {
            "summary": f"Another week of growth, {user_name}!",
            "highlights": ["You're building great habits"],
            "areas_to_improve": ["Stay consistent"],
            "next_week_focus": "Keep the momentum going",
            "motivational_message": "Every day is a new opportunity! 🚀"
        }


async def chat_with_habit_coach(
    message: str,
    user_context: dict
) -> str:
    """Chat with AI habit coach"""
    
    if not model:
        responses = [
            "That's a great question! Focus on starting small and building consistency.",
            "Remember, habits take time to form. Be patient with yourself!",
            "Try linking your new habit to an existing routine. It makes it easier to remember!",
            "Progress, not perfection, is the goal. You're doing great!",
        ]
        return random.choice(responses)
    
    try:
        system_context = f"""
You are a supportive habit coach for the Sankalp app. The user has:
- {user_context.get('total_habits', 5)} habits to track
- A {user_context.get('current_streak', 0)}-day streak
- Completed {user_context.get('total_days', 0)} perfect days out of 100
- ₹500 at stake if they fail

Be encouraging, practical, and concise. Keep responses under 150 words.
"""
        
        prompt = f"""
{system_context}

User's message: {message}

Respond as a friendly habit coach:
"""
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logging.error(f"Error in chat: {str(e)}")
        return "I'm here to help you succeed! What specific habit challenge are you facing today?"