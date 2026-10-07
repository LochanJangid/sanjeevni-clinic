from fastapi import FastAPI
import os
import bcrypt
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from routers import users
from database.connection import Database

app = FastAPI()

# make middleware and add frontend server so only it is allow to talk to me
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

## ROUTERS ------------------
app.include_router(users.router)

## ROOT ----------------------
@app.get("/")
def root():
    return {"msg": "Welcome to sanjeevni clinic API side :]"}

## HEALTH ---------------------
@app.get("/health")
def health():
    db = Database()
    try:
        db.query("SELECT 1")
        return {"status": "healthy",
                "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy",
                "database": "connection failed",
                "Error": str(e)}
