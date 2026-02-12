import uuid
from fastapi_users import schemas
from pydantic import BaseModel
from datetime import datetime


class UserRead(schemas.BaseUser[uuid.UUID]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass


class EmailOtp(BaseModel):
    email: str
    otp: str


class BpMeasurement(BaseModel):
    systolic: int
    diastolic: int
    pulse: int
    timestamp: datetime
    tags: list[str] | None = None
    notes: str | None = None
