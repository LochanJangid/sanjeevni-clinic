import os
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, Header, HTTPException, status
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, Field
import psycopg

from database.connection import Database

router = APIRouter(prefix="/users", tags=["Users"])

db = Database()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


class UserRegistration(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    email: EmailStr | None = None
    mobile: str | None = Field(default=None, max_length=30)
    password: str = Field(min_length=8, max_length=72)


class UserLogin(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=72)


class ProfileUpdate(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    email: EmailStr | None = None
    mobile: str | None = Field(default=None, max_length=30)


def authenticated_user_id(authorization: str | None) -> int:
    if not authorization or not authorization.startswith("Bearer ") or not SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid login session is required",
        )

    try:
        payload = jwt.decode(
            authorization.split(" ", 1)[1],
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        return int(payload["sub"])
    except (JWTError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session is invalid or expired. Please log in again.",
        ) from exc


@router.post("/user_registration/", status_code=status.HTTP_201_CREATED)
def user_registration(user: UserRegistration):
    password_hash = bcrypt.hashpw(
        user.password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    try:
        new_user = db.query(
            """
            INSERT INTO users (username, email, mobile, password_hash)
            VALUES (%s, %s, %s, %s)
            RETURNING id, username, email, mobile
            """,
            (user.username.strip(), user.email, user.mobile, password_hash),
        )
    except psycopg.errors.UniqueViolation as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already uses that username or email.",
        ) from exc

    return {"msg": "Account created successfully", "user": new_user}


@router.post("/user_login/")
def user_login(user: UserLogin):
    cur_user = db.query(
        """
        SELECT id, username, email, mobile, password_hash
        FROM users
        WHERE username = %s
        """,
        (user.username.strip(),),
    )

    if cur_user is None or not bcrypt.checkpw(
        user.password.encode("utf-8"),
        cur_user["password_hash"].encode("utf-8"),
    ):
        return {
            "msg": "Invalid username or password.",
            "username": user.username,
            "is_exists": cur_user is not None,
            "auth_success": False,
        }

    if not SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured on this server.",
        )

    access_token = jwt.encode(
        {
            "sub": str(cur_user["id"]),
            "username": cur_user["username"],
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "msg": "Login successful",
        "username": cur_user["username"],
        "is_exists": True,
        "auth_success": True,
        "user": {
            "id": cur_user["id"],
            "username": cur_user["username"],
            "email": cur_user["email"],
            "mobile": cur_user["mobile"],
        },
        "access_token": access_token,
    }


@router.get("/me")
def get_my_profile(
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    user_id = authenticated_user_id(authorization)
    user = db.query(
        "SELECT id, username, email, mobile FROM users WHERE id = %s",
        (user_id,),
    )

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    return user


@router.put("/me")
def update_my_profile(
    profile: ProfileUpdate,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    user_id = authenticated_user_id(authorization)

    try:
        user = db.query(
            """
            UPDATE users
            SET username = %s, email = %s, mobile = %s
            WHERE id = %s
            RETURNING id, username, email, mobile
            """,
            (profile.username.strip(), profile.email, profile.mobile, user_id),
        )
    except psycopg.errors.UniqueViolation as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That username or email is already in use.",
        ) from exc

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    return user
