import os
from datetime import datetime

import motor.motor_asyncio
from beanie import Document, PydanticObjectId
from beanie import init_beanie
from fastapi_users.db import BaseOAuthAccount, BeanieBaseUser, BeanieUserDatabase
from pydantic import Field, model_validator

DATABASE_URL = os.getenv("MONGODB_URL")
client = motor.motor_asyncio.AsyncIOMotorClient(
    DATABASE_URL, uuidRepresentation="standard"
)
db = client["dev"]


class OAuthAccount(BaseOAuthAccount):
    pass


class User(BeanieBaseUser, Document):
    oauth_accounts: list[OAuthAccount] = Field(default_factory=list)
    otp: str | None = None
    otp_expiration: datetime | None = None

    @model_validator(mode='before')
    def validate_otp_and_expiration(self):
        otp = self.get("otp")
        otp_expiration = self.get("otp_expiration")

        if otp and not otp_expiration:
            raise ValueError("If 'otp' is provided, 'otp_expiration' must also be provided.")
        if otp_expiration and not otp:
            raise ValueError("If 'otp_expiration' is provided, 'otp' must also be provided.")

        return self


async def get_user_db():
    yield BeanieUserDatabase(User, OAuthAccount)


async def init_beanie():
    await init_beanie(
        database=db,
        document_models=[
            User,
            Measurement,
        ],
    )


class Measurement(Document):
    userId: PydanticObjectId = Field(default=None, description="Reference to the user")
    systolic: int = Field(..., gt=0, description="Systolic blood pressure")
    diastolic: int = Field(..., gt=0, description="Diastolic blood pressure")
    pulse: int = Field(..., gt=0, description="Pulse rate")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the measurement")
    tags: list[str] = Field(default_factory=list, description="Tags for the measurement")
    notes: str | None = Field(default=None, description="Optional notes for the measurement")

