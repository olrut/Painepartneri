from datetime import datetime, timezone
import os
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import User, get_async_session
from app.schemas import EmailOtp

otp_router = APIRouter()


async def _handle_success(user: User, redirect_to: Optional[str]):
    target = redirect_to or os.getenv("VERIFY_SUCCESS_REDIRECT")
    if target and target.strip():
        return RedirectResponse(url=target.strip(), status_code=303)
    return {"detail": "OTP_VERIFIED"}


async def _verify_core(user: User, otp_value: str, session: AsyncSession) -> bool:
    now = datetime.now(timezone.utc)
    fixed = os.getenv("TEST_FIXED_OTP")
    if fixed and fixed.strip() and otp_value == fixed.strip():
        user.otp = None
        user.otp_expiration = None
        user.is_verified = True
        await session.commit()
        return True
    if (not user.otp) or (not user.otp_expiration) or user.otp != otp_value or user.otp_expiration < now:
        return False
    user.otp = None
    user.otp_expiration = None
    user.is_verified = True
    await session.commit()
    return True


@otp_router.post("/verify-otp")
async def verify_otp(
    otp: EmailOtp,
    session: AsyncSession = Depends(get_async_session),
    redirect_to: str | None = Query(default=None, description="Optional URL to redirect to on success"),
):
    email = otp.email
    otp = otp.otp
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not await _verify_core(user, otp, session):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    # For POST (API usage), always return JSON success to let client control navigation
    return {"detail": "OTP_VERIFIED"}


@otp_router.get("/verify-otp")
async def verify_otp_get(
    email: str,
    otp: str,
    session: AsyncSession = Depends(get_async_session),
    redirect_to: str | None = Query(default=None, description="Optional URL to redirect to on success"),
):
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not await _verify_core(user, otp, session):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    return await _handle_success(user, redirect_to)
