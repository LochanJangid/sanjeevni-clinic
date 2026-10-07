from fastapi import FastAPI
from pydantic import BaseModel, EmailStr
import os
import psycopg
import bcrypt
from dotenv import load_dotenv
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
from datetime import datetime, timedelta, timezone

app = FastAPI()

# make middleware and add frontend server so only it is allow to talk to me
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL_POOLED")

# Get secret key for jwt
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

@app.get("/")
def root():
    return {"msg": "Welcome to sanjeevni clinic API side :]"}

@app.get("/health")
def health():
    return {"msg": "Database is connected"} if DATABASE_URL is not None else {"msg": "Database connection problem"}

@app.post("/user_registration/")
def user_registration(user: UserRegistration):

    # convert password into password hash for personal security reasons :)
    password_hash = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO users
                    (username, email, mobile, password_hash)
                VALUES
                    (%s, %s, %s, %s)
                RETURNING id, username, email
            """, (user.username, user.email, user.mobile, password_hash))

            new_user = cur.fetchone()

        conn.commit()
    return {"msg": "Regression successfully",
            "user":{
                "id": new_user[0],
                "username": new_user[1],
                "email": new_user[2]
            }}

@app.post("/user_login/")
def user_login(user: UserLogin):

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, username, email, mobile, password_hash
                  FROM users
                 WHERE username=%s
            """, (user.username, ))

            cur_user = cur.fetchone()
        conn.commit()

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