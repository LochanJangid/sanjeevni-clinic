from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

import bcrypt
from jose import jwt
import os

from datetime import datetime, timedelta, timezone

from database.connection import Database

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

db = Database()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


# the schema for user registration
class UserRegistration(BaseModel):
    username: str
    email: EmailStr | None = None
    mobile: str | None = None
    password: str

# the schema for user login
class UserLogin(BaseModel):
    username: str
    password: str


@router.post("/user_registration/")
def user_registration(user: UserRegistration):

    # convert password into password hash for personal security reasons :)
    password_hash = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    new_user = db.query("""
        INSERT INTO users
            (username, email, mobile, password_hash)
        VALUES
            (%s, %s, %s, %s)
        RETURNING id, username, email
    """, (user.username, user.email, user.mobile, password_hash))

    return {"msg": "Regression successfully",
            "user":{
                "id": new_user[0],
                "username": new_user[1],
                "email": new_user[2]
            }}

@router.post("/user_login/")
def user_login(user: UserLogin):
    cur_user = db.query("""
    SELECT id, username, email, mobile, password_hash
    FROM users
    WHERE username=%s
    """, (user.username, ))

    out = {
        "msg": "Login Failed",
        "username": user.username,
        "is_exists": False,
        "auth_success": False
    }

    if cur_user is None:
        return out
    
    out["is_exists"] = True

    stored_pass_hash = cur_user[4]

    if bcrypt.checkpw(user.password.encode("utf-8"), stored_pass_hash.encode("utf-8")):
        out["msg"] = "Login successful"
        out["auth_success"] = True
        out["user"] = {
            "id": cur_user[0],
            "username": cur_user[1],
            "email": cur_user[2],
            "mobile": cur_user[3],
        }

        # make jwt token so it will stay login
        access_token = jwt.encode(
            {
                "sub": str(cur_user[0]),
                "username": str(cur_user[1]),
                "exp": datetime.now(timezone.utc) + timedelta(hours=24) 
            },
            SECRET_KEY,
            algorithm=ALGORITHM
        )
        out["access_token"] = access_token
    return out