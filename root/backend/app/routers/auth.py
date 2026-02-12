from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import User, get_async_session
from app.users import get_user_manager, get_jwt_strategy, UserManager
from app.schemas import UserCreate
from fastapi_users.exceptions import UserAlreadyExists, InvalidPasswordException


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


auth_router = APIRouter()


@auth_router.post("/login", summary="Login with JSON and detailed errors")
async def login_json(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_async_session),
    user_manager: UserManager = Depends(get_user_manager),
) -> Dict[str, Any]:
    # Lookup user by email
    result = await session.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="USER_INACTIVE")

    if not user.is_verified:
        raise HTTPException(status_code=400, detail="USER_NOT_VERIFIED")

    # Verify password and update hashing scheme if needed
    verified, updated_password_hash = user_manager.password_helper.verify_and_update(
        payload.password, user.hashed_password
    )
    if not verified:
        raise HTTPException(status_code=400, detail="INVALID_PASSWORD")

    if updated_password_hash is not None:
        user.hashed_password = updated_password_hash
        await session.commit()

    # Issue JWT using the same strategy as the built-in router
    strategy = get_jwt_strategy()
    token = await strategy.write_token(user)
    return {"access_token": token, "token_type": "bearer"}


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


@auth_router.post("/register", summary="Register with JSON and detailed errors", status_code=201)
@auth_router.post("/register-json", summary="Register with JSON (alias)", status_code=201)
async def register_json(
    payload: RegisterRequest,
    user_manager: UserManager = Depends(get_user_manager),
):
    try:
        user = await user_manager.create(UserCreate(email=payload.email, password=payload.password))
        return {"id": str(user.id), "email": user.email}
    except UserAlreadyExists:
        raise HTTPException(status_code=400, detail="REGISTER_USER_ALREADY_EXISTS")
    except InvalidPasswordException as e:
        # Standardize to a simple code used by tests and frontend
        raise HTTPException(status_code=400, detail="INVALID_PASSWORD")
