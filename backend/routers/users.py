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


def authenticated_token_claims(authorization: str | None) -> dict:
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
        return {
            "id": int(payload["sub"]),
            "username": payload.get("username", ""),
            "role": payload.get("role", "patient"),
            "doctor_id": payload.get("doctor_id"),
        }
    except (JWTError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session is invalid or expired. Please log in again.",
        ) from exc


def authenticated_user_id(authorization: str | None) -> int:
    return authenticated_token_claims(authorization)["id"]


@router.post("/user_registration/", status_code=status.HTTP_201_CREATED)
def user_registration(user: UserRegistration):
    password_hash = bcrypt.hashpw(
        user.password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    try:
        new_user = db.query(
            """
            INSERT INTO users (username, email, mobile, password_hash, role)
            VALUES (%s, %s, %s, %s, 'patient')
            RETURNING id, username, email, mobile, role
            """,
            (user.username.strip(), user.email, user.mobile, password_hash),
        )
    except psycopg.errors.UniqueViolation as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already uses that username or email.",
        ) from exc

    return {"msg": "Account created successfully", "user": new_user}


class DoctorKeyLogin(BaseModel):
    doctor_key: str = Field(min_length=3, max_length=64)


@router.post("/doctor_key_login/")
def doctor_key_login(payload: DoctorKeyLogin):
    cleaned_key = payload.doctor_key.strip().upper()
    cur_user = db.query(
        """
        SELECT u.id, u.username, u.email, u.mobile, u.role, u.doctor_id, u.doctor_key,
               d.name as doctor_name
        FROM users u
        LEFT JOIN doctors d ON u.doctor_id = d.id
        WHERE UPPER(u.doctor_key) = %s OR UPPER(d.doctor_key) = %s
        LIMIT 1
        """,
        (cleaned_key, cleaned_key),
    )

    if not cur_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Doctor Access Key. Please verify the key provided by Sanjeevni Clinic administration.",
        )

    if not SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured on this server.",
        )

    access_token = jwt.encode(
        {
            "sub": str(cur_user["id"]),
            "username": cur_user.get("doctor_name") or cur_user["username"],
            "role": "doctor",
            "doctor_id": cur_user.get("doctor_id"),
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "msg": "Doctor key authentication successful",
        "username": cur_user.get("doctor_name") or cur_user["username"],
        "is_exists": True,
        "auth_success": True,
        "user": {
            "id": cur_user["id"],
            "username": cur_user.get("doctor_name") or cur_user["username"],
            "email": cur_user["email"],
            "mobile": cur_user["mobile"],
            "role": "doctor",
            "doctor_id": cur_user.get("doctor_id"),
        },
        "access_token": access_token,
    }


@router.post("/user_login/")
def user_login(user: UserLogin):
    search_term = user.username.strip()
    
    # 1. First check if search_term is a Doctor Key
    if search_term.upper().startswith("DOC-") or search_term.upper().startswith("DR-"):
        cur_user = db.query(
            """
            SELECT u.id, u.username, u.email, u.mobile, u.password_hash, u.role, u.doctor_id, u.doctor_key,
                   d.name as doctor_name
            FROM users u
            LEFT JOIN doctors d ON u.doctor_id = d.id
            WHERE UPPER(u.doctor_key) = %s OR UPPER(d.doctor_key) = %s
            LIMIT 1
            """,
            (search_term.upper(), search_term.upper()),
        )
        if cur_user:
            access_token = jwt.encode(
                {
                    "sub": str(cur_user["id"]),
                    "username": cur_user.get("doctor_name") or cur_user["username"],
                    "role": "doctor",
                    "doctor_id": cur_user.get("doctor_id"),
                    "exp": datetime.now(timezone.utc) + timedelta(hours=24),
                },
                SECRET_KEY,
                algorithm=ALGORITHM,
            )
            return {
                "msg": "Doctor key login successful",
                "username": cur_user.get("doctor_name") or cur_user["username"],
                "is_exists": True,
                "auth_success": True,
                "user": {
                    "id": cur_user["id"],
                    "username": cur_user.get("doctor_name") or cur_user["username"],
                    "email": cur_user["email"],
                    "mobile": cur_user["mobile"],
                    "role": "doctor",
                    "doctor_id": cur_user.get("doctor_id"),
                },
                "access_token": access_token,
            }

    # 2. Check by username or email
    cur_user = db.query(
        """
        SELECT id, username, email, mobile, password_hash, COALESCE(role, 'patient') as role, doctor_id, doctor_key
        FROM users
        WHERE LOWER(username) = LOWER(%s) OR LOWER(email) = LOWER(%s)
        LIMIT 1
        """,
        (search_term, search_term),
    )

    # 3. Check password verification or doctor key as password
    is_password_valid = False
    if cur_user:
        if cur_user.get("password_hash") and bcrypt.checkpw(
            user.password.encode("utf-8"),
            cur_user["password_hash"].encode("utf-8"),
        ):
            is_password_valid = True
        elif cur_user.get("doctor_key") and user.password.strip().upper() == cur_user["doctor_key"].upper():
            is_password_valid = True

    if cur_user is None or not is_password_valid:
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

    role = cur_user.get("role") or "patient"
    doctor_id = cur_user.get("doctor_id")

    access_token = jwt.encode(
        {
            "sub": str(cur_user["id"]),
            "username": cur_user["username"],
            "role": role,
            "doctor_id": doctor_id,
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
            "role": role,
            "doctor_id": doctor_id,
        },
        "access_token": access_token,
    }


@router.post("/demo_login/{role}")
def demo_login(role: str):
    target_role = role.lower()
    if target_role not in ("admin", "doctor", "patient"):
        raise HTTPException(status_code=400, detail="Invalid role. Choose admin, doctor, or patient.")

    cur_user = db.query(
        """
        SELECT id, username, email, mobile, COALESCE(role, 'patient') as role, doctor_id
        FROM users
        WHERE role = %s
        ORDER BY id ASC
        LIMIT 1
        """,
        (target_role,),
    )

    if not cur_user:
        raise HTTPException(status_code=404, detail=f"No demo user found for role '{target_role}'.")

    if not SECRET_KEY:
        raise HTTPException(status_code=503, detail="Authentication is not configured on this server.")

    access_token = jwt.encode(
        {
            "sub": str(cur_user["id"]),
            "username": cur_user["username"],
            "role": cur_user["role"],
            "doctor_id": cur_user.get("doctor_id"),
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "msg": f"Demo {target_role} login successful",
        "username": cur_user["username"],
        "is_exists": True,
        "auth_success": True,
        "user": {
            "id": cur_user["id"],
            "username": cur_user["username"],
            "email": cur_user["email"],
            "mobile": cur_user["mobile"],
            "role": cur_user["role"],
            "doctor_id": cur_user.get("doctor_id"),
        },
        "access_token": access_token,
    }


@router.get("/me")
def get_my_profile(
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    user_claims = authenticated_token_claims(authorization)
    user = db.query(
        "SELECT id, username, email, mobile, COALESCE(role, 'patient') as role, doctor_id FROM users WHERE id = %s",
        (user_claims["id"],),
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
            SET username = %s, email = %s, mobile = %s, update_at = NOW()
            WHERE id = %s
            RETURNING id, username, email, mobile, COALESCE(role, 'patient') as role, doctor_id
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


@router.get("/all")
def get_all_users(
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required.")

    return db.query(
        """
        SELECT id, username, email, mobile, COALESCE(role, 'patient') as role, doctor_id, created_at
        FROM users
        ORDER BY id DESC
        """,
        decision="fetchall",
    )

