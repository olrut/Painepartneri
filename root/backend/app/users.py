import os
import secrets
from datetime import timedelta, datetime
from typing import Optional, Union

from beanie import PydanticObjectId
from fastapi import Depends, Request, HTTPException
from fastapi_users import BaseUserManager, FastAPIUsers, models, InvalidPasswordException
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.db import BeanieUserDatabase, ObjectIDIDMixin
from httpx_oauth.clients.google import GoogleOAuth2
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.db import User, get_user_db
from app.schemas import UserCreate

SECRET = os.getenv("SECRET_KEY")
SENDGRID_API_KEY = os.getenv("SENDGRID_KEY")

# Default scopes "userinfo.profile","userinfo.email"
google_oauth_client = GoogleOAuth2(
    os.getenv("GOOGLE_CLIENT_ID", ""),
    os.getenv("GOOGLE_CLIENT_SECRET", ""),
)
SEND_FROM = os.getenv("SEND_FROM")


def send_email_with_sendgrid(to_email: str, otp: str):
    """
    Sends an email with SendGrid
    :param to_email:
    :param otp:
    :return:
    """
    message = Mail(
        from_email=SEND_FROM,
        to_emails=to_email,
        subject="Your OTP Code",
        html_content=f"<p>Your OTP code is: <strong>{otp}</strong></p>"
    )

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"Email sent! Status code: {response.status_code}")
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email")


class UserManager(ObjectIDIDMixin, BaseUserManager[User, PydanticObjectId]):
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

    #    async def on_after_register(self, user: User, request: Optional[Request] = None):
    # {
    #        }

    async def on_after_forgot_password(
            self, user: User, token: str, request: Optional[Request] = None
    ):
        print(f"User {user.id} has forgot their password. Reset token: {token}")

    async def on_after_request_verify(
            self, user: User, token: str, request: Optional[Request] = None
    ):
        email = user.email
        # Generate 4-digit OTP
        otp = ''.join(secrets.choice('0123456789') for _ in range(4))
        otp_expiration = datetime.now() + timedelta(minutes=10)
        send_email_with_sendgrid(email, otp)
        # Save user OTP to the database
        user.otp = otp
        user.otp_expiration = otp_expiration
        await user.save()

        print(f"User {user.id} has requested verification. OTP: {otp}")

    async def on_after_verify(self, user: User, request: Optional[Request] = None):
        print(f"User {user.id} has been verified.")


async def get_user_manager(user_db: BeanieUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)


bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy[models.UP, models.ID]:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, PydanticObjectId](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
