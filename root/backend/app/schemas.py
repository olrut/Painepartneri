from beanie import PydanticObjectId
from fastapi_users import schemas
from pydantic import BaseModel


class UserRead(schemas.BaseUser[PydanticObjectId]):
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
    timestamp: str
    tags: list[str] = None
    notes: str = None
