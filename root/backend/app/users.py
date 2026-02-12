import os
import secrets
import uuid
from datetime import timedelta, datetime, timezone
from typing import Optional, Union

import requests
import logging
from fastapi import Depends, Request, HTTPException
from fastapi_users import BaseUserManager, FastAPIUsers, models, InvalidPasswordException
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from fastapi_users.manager import UUIDIDMixin
from httpx_oauth.clients.google import GoogleOAuth2

from app.db import User, get_user_db
from app.schemas import UserCreate

SECRET = os.getenv("SECRET_KEY")
if not SECRET or not isinstance(SECRET, str) or not SECRET.strip():
    raise RuntimeError(
        "SECRET_KEY is missing. Set it in your environment or .env (e.g., SECRET_KEY=your-long-random-string)."
    )
RESEND_API_KEY = os.getenv("RESEND_API_KEY")

# Default scopes "userinfo.profile","userinfo.email"
google_oauth_client = GoogleOAuth2(
    os.getenv("GOOGLE_CLIENT_ID", ""),
    os.getenv("GOOGLE_CLIENT_SECRET", ""),
)
SEND_FROM = os.getenv("SEND_FROM")
logger = logging.getLogger("app.otp")

# Optional testing override: set TEST_FIXED_OTP to force a specific OTP
TEST_FIXED_OTP = os.getenv("TEST_FIXED_OTP")


def generate_otp() -> str:
    """Generate a 4-digit OTP, or return fixed OTP if TEST_FIXED_OTP is set."""
    if TEST_FIXED_OTP and TEST_FIXED_OTP.strip():
        fixed = TEST_FIXED_OTP.strip()
        # Log once per call so it’s visible in dev logs
        logger.info("Using TEST_FIXED_OTP override: %s", fixed)
        return fixed
    return ''.join(secrets.choice('0123456789') for _ in range(4))


def send_email_with_resend(to_email: str, otp: str):
    """
    Sends an email using Resend HTTP API
    :param to_email:
    :param otp:
    :return:
    """
    # Check if email sending is disabled via env
    send_emails = os.getenv("SEND_EMAILS", "true").strip().lower() not in ("0", "false", "no")
    if not send_emails:
        logger.info("SEND_EMAILS disabled; skipping email to=%s (OTP=%s)", to_email, otp)
        return

    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Email service not configured: RESEND_API_KEY missing")
    if not SEND_FROM or not SEND_FROM.strip():
        raise HTTPException(status_code=500, detail="Email service not configured: SEND_FROM missing")

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
    }
    # Compose optional verification link
    verify_base = os.getenv("VERIFY_LINK_BASE") or os.getenv("PUBLIC_BACKEND_BASE_URL")
    target_redirect = os.getenv("VERIFY_SUCCESS_REDIRECT")
    verify_link = None
    if verify_base and verify_base.strip():
        from urllib.parse import quote
        verify_base = verify_base.strip().rstrip("/")
        verify_link = f"{verify_base}/auth/verify-otp?email={quote(to_email)}&otp={quote(otp)}"
        if target_redirect and target_redirect.strip():
            verify_link += f"&redirect_to={quote(target_redirect.strip())}"

    payload = {
        "from": SEND_FROM,
        "to": [to_email],
        "subject": "Your OTP Code",
        "html": (
            f"<p>Your OTP code is: <strong>{otp}</strong></p>"
            + (f"<p><a href=\"{verify_link}\">Click here to verify</a></p>" if verify_link else "")
        ),
    }
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        if resp.status_code not in (200, 201):
            # Resend returns JSON with an error message
            try:
                detail = resp.json()
            except Exception:
                detail = {"message": resp.text}
            raise HTTPException(status_code=500, detail=f"Email send failed: {detail}")
        try:
            rid = resp.json().get("id")
        except Exception:
            rid = None
        logger.info("OTP email queued via Resend: to=%s id=%s", to_email, rid)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email send exception: {e}")


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def validate_password(
            self,
            password: str,
            user: Union[UserCreate, User],
    ) -> None:
        if len(password) < 8:
            raise InvalidPasswordException(
                reason="Password should be at least 8 characters"
            )
        if user.email in password:
            raise InvalidPasswordException(
                reason="Password should not contain e-mail"
            )

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        logger.info("on_after_register called for user_id=%s email=%s", str(user.id), user.email)
        try:
            # Send OTP immediately after registration
            email = user.email
            otp = generate_otp()
            otp_expiration = datetime.now(timezone.utc) + timedelta(minutes=10)
            send_email_with_resend(email, otp)
            user.otp = otp
            user.otp_expiration = otp_expiration
            await self.user_db.update(user, {"otp": otp, "otp_expiration": otp_expiration})
            logger.info("User registered: user_id=%s email=%s otp=%s", str(user.id), user.email, otp)
            print(f"OTP for {user.email} (register): {otp}", flush=True)
        except Exception:
            logger.exception("on_after_register failed for user_id=%s email=%s", str(user.id), user.email)
            raise

    async def on_after_forgot_password(
            self, user: User, token: str, request: Optional[Request] = None
    ):
        print(f"User {user.id} has forgot their password. Reset token: {token}")

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ) -> None:
        logger.info("on_after_request_verify called for user_id=%s email=%s", str(user.id), user.email)
        try:
            email = user.email
            otp = generate_otp()
            otp_expiration = datetime.now(timezone.utc) + timedelta(minutes=10)
            send_email_with_resend(email, otp)
            # Save user OTP to the database
            user.otp = otp
            user.otp_expiration = otp_expiration
            await self.user_db.update(user, {"otp": otp, "otp_expiration": otp_expiration})

            logger.info("Verification requested: user_id=%s email=%s otp=%s", str(user.id), user.email, otp)
            print(f"OTP for {user.email} (request-verify-token): {otp}", flush=True)
        except Exception:
            logger.exception("on_after_request_verify failed for user_id=%s email=%s", str(user.id), user.email)
            raise

    async def on_after_verify(self, user: User, request: Optional[Request] = None):
        logger.info("User verified: user_id=%s email=%s", str(user.id), user.email)


async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)


bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy[models.UP, models.ID]:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
