import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Measurement, User, get_async_session
from app.schemas import BpMeasurement
from app.users import fastapi_users

measurement_router = APIRouter()

current_active_verified_user = fastapi_users.current_user(active=True, verified=True)


@measurement_router.post("/bp")
async def create_bp(
    measurement: BpMeasurement,
    user: User = Depends(current_active_verified_user),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Saves a blood pressure measurement
    :param token:
    :param user:
    :param measurement:
    :return:
    """
    db_obj = Measurement(
        user_id=user.id,
        systolic=measurement.systolic,
        diastolic=measurement.diastolic,
        pulse=measurement.pulse,
        timestamp=measurement.timestamp,
        tags=measurement.tags or [],
        notes=measurement.notes,
    )
    session.add(db_obj)
    await session.commit()
    return {"ok": True, "id": str(db_obj.id)}


@measurement_router.get("/bp")
async def list_bp(
    user: User = Depends(current_active_verified_user),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Retrieves blood pressure measurements
    :param token:
    :param user:
    :return:
    """
    result = await session.execute(
        select(Measurement).where(Measurement.user_id == user.id).order_by(Measurement.timestamp.desc())
    )
    measurements = result.scalars().all()
    return [
        {
            "id": str(m.id),
            "userId": str(m.user_id),
            "systolic": m.systolic,
            "diastolic": m.diastolic,
            "pulse": m.pulse,
            "timestamp": m.timestamp.isoformat(),
            "tags": m.tags or [],
            "notes": m.notes,
        }
        for m in measurements
    ]


@measurement_router.delete("/bp/{measurement_id}")
async def delete_bp(
    measurement_id: uuid.UUID,
    user: User = Depends(current_active_verified_user),
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(Measurement).where(Measurement.id == measurement_id, Measurement.user_id == user.id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="MEASUREMENT_NOT_FOUND")
    await session.delete(m)
    await session.commit()
    return {"ok": True, "id": str(measurement_id)}
