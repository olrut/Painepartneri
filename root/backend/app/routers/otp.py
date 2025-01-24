from datetime import datetime

from fastapi import APIRouter, HTTPException
from app.db import User
from app.schemas import EmailOtp

otp_router = APIRouter()


@otp_router.post("/verify-otp")
async def verify_otp(otp: EmailOtp):
    email = otp.email
    otp = otp.otp
    user = await User.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Confirm that the OTP is correct and has not expired
    if user.otp != otp or user.otp_expiration < datetime.now():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Update the user's record to indicate that the email has been verified
    user.otp = None
    user.otp_expiration = None
    user.is_verified = True
    await user.save()

    return {"message": "Email verified successfully"}
