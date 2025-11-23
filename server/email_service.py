# server/email_service.py
import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# ✅ Remove spaces from App Password if present
if SMTP_PASSWORD:
    SMTP_PASSWORD = SMTP_PASSWORD.replace(" ", "")

# OTP storage (in production, use Redis or database)
otp_store = {}

def check_email_config():
    """Check if email configuration is set"""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logging.error(f"❌ Email configuration missing!")
        logging.error(f"SMTP_EMAIL: {'Set' if SMTP_EMAIL else 'Not Set'}")
        logging.error(f"SMTP_PASSWORD: {'Set' if SMTP_PASSWORD else 'Not Set'}")
        return False
    
    logging.info(f"✅ Email config loaded: {SMTP_EMAIL}")
    return True

def generate_otp():
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp_email(to_email: str, otp: str, name: str = "User"):
    """Send OTP via email"""
    
    # Check configuration first
    if not check_email_config():
        logging.error("❌ Email not configured. Check .env file")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        msg['Subject'] = "🔥 Your Sankalp Verification Code"

        # HTML email template
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                    background-color: #0f172a; 
                    color: #e2e8f0; 
                    margin: 0;
                    padding: 0;
                }}
                .container {{ 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 40px 20px; 
                }}
                .header {{ 
                    text-align: center; 
                    margin-bottom: 30px; 
                }}
                .logo {{ 
                    font-size: 36px; 
                    font-weight: bold; 
                    color: #f97316; 
                    margin-bottom: 10px;
                }}
                .tagline {{
                    color: #94a3b8;
                    font-size: 14px;
                }}
                .content {{
                    background: #1e293b;
                    border-radius: 16px;
                    padding: 30px;
                    margin: 20px 0;
                }}
                .otp-box {{ 
                    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                    border-radius: 12px; 
                    padding: 30px; 
                    text-align: center; 
                    margin: 30px 0; 
                }}
                .otp-code {{ 
                    font-size: 48px; 
                    font-weight: bold; 
                    color: #ffffff; 
                    letter-spacing: 12px; 
                    font-family: 'Courier New', monospace;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }}
                .expire-text {{
                    color: #fef3c7;
                    margin-top: 10px;
                    font-size: 14px;
                }}
                .greeting {{
                    font-size: 18px;
                    margin-bottom: 15px;
                }}
                .info-text {{
                    color: #94a3b8;
                    line-height: 1.6;
                }}
                .footer {{ 
                    text-align: center; 
                    color: #64748b; 
                    font-size: 12px; 
                    margin-top: 40px; 
                    padding-top: 20px;
                    border-top: 1px solid #334155;
                }}
                .warning {{
                    background: #7f1d1d;
                    color: #fecaca;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 20px;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🔥 Sankalp</div>
                    <p class="tagline">Commitment Shuru Karo</p>
                </div>
                
                <div class="content">
                    <p class="greeting">Hello {name} 👋</p>
                    
                    <p class="info-text">Welcome to Sankalp - where excuses go to die!</p>
                    <p class="info-text">Use this verification code to complete your signup:</p>
                    
                    <div class="otp-box">
                        <div class="otp-code">{otp}</div>
                        <p class="expire-text">⏱️ Expires in 10 minutes</p>
                    </div>
                    
                    <p class="info-text">
                        Once verified, you'll be ready to put your ₹500 where your mouth is 
                        and start your 100-day transformation journey!
                    </p>
                    
                    <div class="warning">
                        ⚠️ <strong>Warning:</strong> If you didn't request this code, 
                        please ignore this email. Someone might be trying to test your commitment level! 😅
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong>Remember:</strong> Talk is cheap. ₹500 isn't.</p>
                    <p>© 2025 Sankalp. Built for the disciplined.</p>
                    <p style="margin-top: 10px; color: #475569;">
                        This is an automated email. Please do not reply.<br>
                        Need help? Contact us at support@sankalp.app
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        # Plain text alternative
        text = f"""
        Sankalp - Verification Code
        
        Hello {name},
        
        Your verification code is: {otp}
        
        This code will expire in 10 minutes.
        
        If you didn't request this code, please ignore this email.
        
        Remember: Talk is cheap. ₹500 isn't.
        
        - Team Sankalp
        """

        # Attach parts
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        msg.attach(part1)
        msg.attach(part2)

        # Send email with better error handling
        logging.info(f"📧 Attempting to send OTP to {to_email}")
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.set_debuglevel(0)  # Set to 1 for debugging
            server.starttls()
            
            try:
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                logging.info(f"✅ SMTP login successful")
            except smtplib.SMTPAuthenticationError as auth_error:
                logging.error(f"❌ SMTP Authentication failed: {auth_error}")
                logging.error("Make sure you're using an App Password, not your regular Gmail password")
                return False
            
            server.send_message(msg)
            logging.info(f"✅ OTP email sent successfully to {to_email}")

        return True

    except smtplib.SMTPException as smtp_error:
        logging.error(f"❌ SMTP Error: {smtp_error}")
        return False
    except Exception as e:
        logging.error(f"❌ Unexpected error sending email: {str(e)}")
        logging.error(f"Type of error: {type(e).__name__}")
        return False

def store_otp(email: str, otp: str):
    """Store OTP with expiry"""
    otp_store[email] = {
        "otp": otp,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=10)
    }
    logging.info(f"📝 OTP stored for {email}: {otp}")

def verify_otp(email: str, otp: str) -> bool:
    """Verify OTP"""
    if email not in otp_store:
        logging.warning(f"❌ No OTP found for {email}")
        return False

    stored_data = otp_store[email]
    
    # Check expiry
    if datetime.utcnow() > stored_data["expires_at"]:
        del otp_store[email]
        logging.warning(f"❌ OTP expired for {email}")
        return False

    # Check OTP match
    if stored_data["otp"] == otp:
        del otp_store[email]  # Delete after successful verification
        logging.info(f"✅ OTP verified for {email}")
        return True

    logging.warning(f"❌ Invalid OTP for {email}")
    return False

# Test configuration on import
if __name__ == "__main__":
    check_email_config()