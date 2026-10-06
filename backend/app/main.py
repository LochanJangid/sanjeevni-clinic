from fastapi import FastAPI
from pydantic import BaseModel, EmailStr
import os
import psycopg
import bcrypt
from dotenv import load_dotenv
from pathlib import Path

app = FastAPI()

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL_POOLED")

# the schema for user registration
class UserRegistration(BaseModel):
    username: str
    email: EmailStr
    mobile: str | None = None
    password: str

@app.get("/")
def root():
    return {"msg": "Welcome to sanjeevni clinic API side :]"}

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
def user_login(user):
    return {"Log in ": user}