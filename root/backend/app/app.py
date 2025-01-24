import os
from contextlib import asynccontextmanager

from beanie import init_beanie
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.db import User, Measurement, db
from app.routers.measurements import measurement_router
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
    await init_beanie(
        database=db,
        document_models=[
            User,
            Measurement,
        ],
    )
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # Allow only these origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow http methods (GET, POST, jne.)
    allow_headers=["*"],  # Allow all headers TODO: Update for production
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


@app.get("/authenticated-route")
async def authenticated_route(user: User = Depends(current_active_user)):
    return {"message": f"Hello {user.email}!"}


@app.get("/")
async def redirect_to_docs():
    return RedirectResponse(url="/docs")
