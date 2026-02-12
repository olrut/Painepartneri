import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from sqlalchemy.ext.asyncio import AsyncEngine

from app.db import User, Measurement, Base, engine
from app.routers.measurements import measurement_router
from app.routers.fhir import fhir_router
from app.routers.auth import auth_router
from app.routers.otp import otp_router as otp_router
from app.schemas import UserCreate, UserRead, UserUpdate
from app.users import (
    SECRET,
    auth_backend,
    current_active_user,
    fastapi_users,
    google_oauth_client,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB schema at startup (dev convenience)
    auto_create = os.getenv("AUTO_CREATE_DB_SCHEMA", "true").strip().lower() in ("1", "true", "yes")
    if auto_create:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    try:
        yield
    finally:
        await engine.dispose()


app = FastAPI(lifespan=lifespan)

# Configure CORS from env (comma-separated). Support "*"/"all" to allow any origin in dev.
cors_from_env = os.getenv("CORS_ORIGINS")
allow_all_origins = False
if cors_from_env:
    cors_from_env = cors_from_env.strip()
    if cors_from_env in ("*", "all", "ALL"):
        allow_all_origins = True
        allowed_origins = []
    else:
        allowed_origins = [o.strip() for o in cors_from_env.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

if allow_all_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(
    fastapi_users.get_auth_router(auth_backend, requires_verification=True), prefix="/auth/jwt", tags=["auth"]
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)
# Automatically associate OAuth2 credentials with users based on
app.include_router(
    fastapi_users.get_oauth_router(google_oauth_client, auth_backend, SECRET, associate_by_email=True,
                                   is_verified_by_default=True, redirect_url=os.getenv("GOOGLE_REDIRECT_URI")),
    prefix="/auth/google",
    tags=["auth"],
)

app.include_router(otp_router, prefix="/auth", tags=["auth"]) 

app.include_router(measurement_router, prefix="/measurements", tags=["measurements"]) 

# FHIR-compatible endpoints (minimal Observation + Patient)
app.include_router(fhir_router, prefix="/fhir", tags=["fhir"]) 

# JSON login endpoint with detailed error messages
app.include_router(auth_router, prefix="/auth", tags=["auth"]) 


@app.get("/authenticated-route")
async def authenticated_route(user: User = Depends(current_active_user)):
    return {"message": f"Hello {user.email}!"}


@app.get("/")
async def redirect_to_docs():
    return RedirectResponse(url="/docs")
