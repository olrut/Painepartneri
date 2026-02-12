import os
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional

from sqlalchemy import ForeignKey, String, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from fastapi_users_db_sqlalchemy import (
    SQLAlchemyBaseUserTableUUID,
    SQLAlchemyBaseOAuthAccountTableUUID,
    SQLAlchemyUserDatabase,
)
from fastapi import Depends


DATABASE_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("POSTGRES_URL")
    # Default to the same DB name as docker-compose.yml ("backend") for local dev consistency
    or "postgresql+asyncpg://postgres:postgres@localhost:5432/backend"
)


class Base(DeclarativeBase):
    pass


class OAuthAccount(SQLAlchemyBaseOAuthAccountTableUUID, Base):
    __tablename__ = "oauth_accounts"
    user: Mapped["User"] = relationship(back_populates="oauth_accounts")


class User(SQLAlchemyBaseUserTableUUID, Base):
    # Match the FK target expected by OAuthAccount base ("user.id")
    __tablename__ = "user"
    oauth_accounts: Mapped[list[OAuthAccount]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    otp: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    otp_expiration: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class Measurement(Base):
    __tablename__ = "measurements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    systolic: Mapped[int] = mapped_column()
    diastolic: Mapped[int] = mapped_column()
    pulse: Mapped[int] = mapped_column()
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    tags: Mapped[Optional[list[str]]] = mapped_column(JSONB, default=list)
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)


engine = create_async_engine(DATABASE_URL, echo=False, future=True)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


async def get_user_db(
    session: AsyncSession = Depends(get_async_session),
) -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    yield SQLAlchemyUserDatabase(session, User, OAuthAccount)
