# server/social.py
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from database import supabase

logging.basicConfig(level=logging.INFO)


class FriendshipManager:
    """Manage friendships and accountability partners"""
    
    @staticmethod
    def send_friend_request(from_user_id: int, to_email: str) -> Dict[str, Any]:
        """Send a friend request"""
        try:
            # Find target user
            target = supabase.table('users').select('id, name, email').eq(
                'email', to_email
            ).single().execute()
            
            if not target.data:
                return {'success': False, 'error': 'User not found'}
            
            if target.data['id'] == from_user_id:
                return {'success': False, 'error': 'Cannot add yourself'}
            
            # Check if already friends or pending
            existing = supabase.table('friendships').select('*').or_(
                f"and(user1_id.eq.{from_user_id},user2_id.eq.{target.data['id']})",
                f"and(user1_id.eq.{target.data['id']},user2_id.eq.{from_user_id})"
            ).execute()
            
            if existing.data:
                status = existing.data[0]['status']
                if status == 'accepted':
                    return {'success': False, 'error': 'Already friends'}
                elif status == 'pending':
                    return {'success': False, 'error': 'Request already pending'}
            
            # Create friend request
            supabase.table('friendships').insert({
                'user1_id': from_user_id,
                'user2_id': target.data['id'],
                'status': 'pending',
                'created_at': datetime.now().isoformat()
            }).execute()
            
            # Create notification
            from notifications import NotificationManager
            NotificationManager.create_in_app_notification(
                user_id=target.data['id'],
                notification_type='friend_request',
                title='👥 New Friend Request',
                message=f'Someone wants to be your accountability partner!',
                action_url='/friends'
            )
            
            return {'success': True, 'message': 'Friend request sent'}
            
        except Exception as e:
            logging.error(f"Error sending friend request: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def respond_to_request(friendship_id: int, user_id: int, accept: bool) -> Dict[str, Any]:
        """Accept or reject friend request"""
        try:
            friendship = supabase.table('friendships').select('*').eq(
                'id', friendship_id
            ).eq('user2_id', user_id).eq('status', 'pending').single().execute()
            
            if not friendship.data:
                return {'success': False, 'error': 'Request not found'}
            
            new_status = 'accepted' if accept else 'rejected'
            
            supabase.table('friendships').update({
                'status': new_status,
                'responded_at': datetime.now().isoformat()
            }).eq('id', friendship_id).execute()
            
            if accept:
                # Notify the requester
                from notifications import NotificationManager
                NotificationManager.create_in_app_notification(
                    user_id=friendship.data['user1_id'],
                    notification_type='friend_accepted',
                    title='🎉 Friend Request Accepted',
                    message='You have a new accountability partner!',
                    action_url='/friends'
                )
            
            return {'success': True, 'status': new_status}
            
        except Exception as e:
            logging.error(f"Error responding to request: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_friends(user_id: int) -> List[Dict[str, Any]]:
        """Get user's friends with their stats"""
        try:
            friendships = supabase.table('friendships').select('*').eq(
                'status', 'accepted'
            ).or_(
                f"user1_id.eq.{user_id}",
                f"user2_id.eq.{user_id}"
            ).execute()
            
            friends = []
            for f in (friendships.data or []):
                friend_id = f['user2_id'] if f['user1_id'] == user_id else f['user1_id']
                
                # Get friend info
                friend = supabase.table('users').select(
                    'id, name, email, total_xp'
                ).eq('id', friend_id).single().execute()
                
                if friend.data:
                    # Get their streak
                    streaks = supabase.table('habit_streaks').select(
                        'current_streak'
                    ).eq('user_id', friend_id).execute()
                    
                    max_streak = max([s['current_streak'] for s in (streaks.data or [])], default=0)
                    
                    # Get today's progress
                    today = date.today().strftime('%Y-%m-%d')
                    habits = supabase.table('habits').select('id').eq('user_id', friend_id).execute()
                    checkins = supabase.table('checkins').select('*').eq(
                        'user_id', friend_id
                    ).eq('date', today).eq('completed', True).execute()
                    
                    friends.append({
                        'id': friend.data['id'],
                        'name': friend.data['name'],
                        'xp': friend.data.get('total_xp', 0),
                        'current_streak': max_streak,
                        'habits_today': f"{len(checkins.data or [])}/{len(habits.data or [])}",
                        'friendship_id': f['id'],
                        'since': f['responded_at'] or f['created_at']
                    })
            
            return friends
            
        except Exception as e:
            logging.error(f"Error getting friends: {str(e)}")
            return []
    
    @staticmethod
    def get_pending_requests(user_id: int) -> List[Dict[str, Any]]:
        """Get pending friend requests"""
        try:
            requests = supabase.table('friendships').select(
                '*, users!friendships_user1_id_fkey(name, email)'
            ).eq('user2_id', user_id).eq('status', 'pending').execute()
            
            return requests.data or []
        except Exception as e:
            logging.error(f"Error getting requests: {str(e)}")
            return []


class AccountabilityChallenge:
    """Create challenges between friends"""
    
    @staticmethod
    def create_challenge(
        creator_id: int,
        friend_id: int,
        habit_name: str,
        duration_days: int,
        stake: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a challenge between friends"""
        try:
            # Verify friendship
            friendship = supabase.table('friendships').select('*').eq(
                'status', 'accepted'
            ).or_(
                f"and(user1_id.eq.{creator_id},user2_id.eq.{friend_id})",
                f"and(user1_id.eq.{friend_id},user2_id.eq.{creator_id})"
            ).execute()
            
            if not friendship.data:
                return {'success': False, 'error': 'Not friends'}
            
            start_date = date.today()
            end_date = start_date + timedelta(days=duration_days)
            
            challenge = supabase.table('challenges').insert({
                'creator_id': creator_id,
                'participant_id': friend_id,
                'habit_name': habit_name,
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'stake': stake,
                'status': 'pending',
                'creator_progress': 0,
                'participant_progress': 0,
                'created_at': datetime.now().isoformat()
            }).execute()
            
            # Notify friend
            from notifications import NotificationManager
            NotificationManager.create_in_app_notification(
                user_id=friend_id,
                notification_type='challenge_invite',
                title='⚔️ Challenge Received!',
                message=f'You have been challenged to a {duration_days}-day {habit_name} challenge!',
                action_url='/challenges'
            )
            
            return {'success': True, 'challenge': challenge.data[0] if challenge.data else None}
            
        except Exception as e:
            logging.error(f"Error creating challenge: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def update_challenge_progress(challenge_id: int, user_id: int):
        """Update progress for a challenge"""
        try:
            challenge = supabase.table('challenges').select('*').eq(
                'id', challenge_id
            ).single().execute()
            
            if not challenge.data or challenge.data['status'] != 'active':
                return
            
            is_creator = challenge.data['creator_id'] == user_id
            field = 'creator_progress' if is_creator else 'participant_progress'
            
            new_progress = challenge.data[field] + 1
            
            supabase.table('challenges').update({
                field: new_progress
            }).eq('id', challenge_id).execute()
            
            # Check for winner
            start = datetime.strptime(challenge.data['start_date'], '%Y-%m-%d').date()
            end = datetime.strptime(challenge.data['end_date'], '%Y-%m-%d').date()
            total_days = (end - start).days + 1
            
            if new_progress >= total_days:
                # This user completed the challenge
                loser_id = challenge.data['participant_id'] if is_creator else challenge.data['creator_id']
                
                supabase.table('challenges').update({
                    'status': 'completed',
                    'winner_id': user_id
                }).eq('id', challenge_id).execute()
                
                # Award XP
                supabase.rpc('add_user_xp', {'user_id': user_id, 'xp': 500}).execute()
                
        except Exception as e:
            logging.error(f"Error updating challenge: {str(e)}")