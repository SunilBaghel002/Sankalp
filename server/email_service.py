# server/email_service.py
import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)

# Email configuration
SMTP_SERVER = "smtp.gmail.com"  # Use Gmail SMTP
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL")  # Your Gmail
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")  # App Password (not regular password)

# OTP storage (in production, use Redis or database)
otp_store = {}

def generate_otp():
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp_email(to_email: str, otp: str, name: str = "User"):
    """Send OTP via email"""
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        msg['Subject'] = "Your Sankalp Verification Code"

        # HTML email template
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
                .header {{ text-align: center; margin-bottom: 30px; }}
                .logo {{ font-size: 32px; font-weight: bold; color: #f97316; }}
                .otp-box {{ background: #1e293b; border: 2px solid #f97316; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }}
                .otp-code {{ font-size: 42px; font-weight: bold; color: #f97316; letter-spacing: 8px; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 40px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🔥 Sankalp</div>
                    <p style="color: #94a3b8;">Commitment Shuru Karo</p>
                </div>
                
                <p>Hello {name},</p>
                
                <p>Welcome to Sankalp! Use the code below to verify your email address:</p>
                
                <div class="otp-box">
                    <div class="otp-code">{otp}</div>
                    <p style="color: #94a3b8; margin-top: 10px;">This code expires in 10 minutes</p>
                </div>
                
                <p style="color: #94a3b8;">If you didn't request this code, please ignore this email.</p>
                
                <div class="footer">
                    <p>© 2025 Sankalp. Built for the disciplined.</p>
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Attach HTML
        part = MIMEText(html, 'html')
        msg.attach(part)

        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)

        logging.info(f"✅ OTP sent to {to_email}")
        return True

    except Exception as e:
        logging.error(f"❌ Failed to send email: {str(e)}")
        return False

def store_otp(email: str, otp: str):
    """Store OTP with expiry"""
    otp_store[email] = {
        "otp": otp,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=10)
    }
    logging.info(f"OTP stored for {email}: {otp}")

def verify_otp(email: str, otp: str) -> bool:
    """Verify OTP"""
    if email not in otp_store:
        return False

    stored_data = otp_store[email]
    
    # Check expiry
    if datetime.utcnow() > stored_data["expires_at"]:
        del otp_store[email]
        return False

    # Check OTP match
    if stored_data["otp"] == otp:
        del otp_store[email]  # Delete after successful verification
        return True

    return False