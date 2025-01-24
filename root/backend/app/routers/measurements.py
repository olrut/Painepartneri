from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer

from app.db import Measurement, User
from app.users import fastapi_users

measurement_router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

current_active_verified_user = fastapi_users.current_user(active=True, verified=True)


@measurement_router.post("/bp")
async def bp(measurement: Measurement, user: User = Depends(current_active_verified_user)):
    """
    Saves a blood pressure measurement
    :param token:
    :param user:
    :param measurement:
    :return:
    """
    measurement.userId = user.id
    await Measurement.insert_one(measurement)

    return {"ok"}


@measurement_router.get("/bp")
async def bp(user=Depends(current_active_verified_user)):
    """
    Retrieves blood pressure measurements
    :param token:
    :param user:
    :return:
    """
    measurements = await Measurement.find({"userId": user.id}).to_list()

    return measurements
