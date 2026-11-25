import smtplib
from email.message import EmailMessage
import httpx
from backend.config import settings


async def send_reset_code_email(to_email: str, code: str) -> bool:
    """
    Send a 6-digit password reset code via Resend API (if RESEND_API_KEY is set)
    or via SMTP (if SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are set).
    Returns True if an email was dispatched, False if no provider is configured.
    """
    subject = "Illusion — Your Password Reset Code"
    text_body = (
        f"Your Illusion password reset code is: {code}\n\n"
        "This code will expire in 15 minutes. If you did not request this, you can safely ignore this email."
    )
    html_body = f"""
    <div style="font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 480px; margin: auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px;">Illusion</h2>
      <p style="margin: 0 0 20px 0; color: #a3a3a3; font-size: 13px;">Password Reset Request</p>
      <p style="font-size: 14px; line-height: 1.6; color: #e5e5e5;">Use the verification code below to reset your password. It expires in 15 minutes.</p>
      <div style="margin: 24px 0; padding: 16px; background: #171717; border: 1px solid #262626; border-radius: 12px; text-align: center;">
        <span style="font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #ffffff;">{code}</span>
      </div>
      <p style="font-size: 12px; color: #737373; margin: 0;">If you did not request a password reset, you can safely ignore this email.</p>
    </div>
    """

    # 1. Try Resend API first (recommended for Render/cloud where SMTP ports may be restricted)
    if settings.RESEND_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": settings.EMAIL_FROM,
                        "to": [to_email],
                        "subject": subject,
                        "text": text_body,
                        "html": html_body,
                    },
                )
                if 200 <= resp.status_code < 300:
                    return True
                print(f"[Email] Resend API failed ({resp.status_code}): {resp.text}")
        except Exception as e:
            print(f"[Email] Resend API error: {e}")

    # 2. Fallback to SMTP (Gmail / Brevo / Mailgun / custom SMTP)
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = settings.EMAIL_FROM
            msg["To"] = to_email
            msg.set_content(text_body)
            msg.add_alternative(html_body, subtype="html")

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"[Email] SMTP error: {e}")

    return False
