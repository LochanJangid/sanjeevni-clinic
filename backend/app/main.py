from fastapi import FastAPI
import os
import bcrypt
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from routers import users
from routers import doctors
from routers import appointments
from routers import assistant
from routers import prescriptions
from routers import billing
from routers import admin
from database.connection import Database

app = FastAPI(title="Sanjeevni Clinic SaaS API", version="2.0.0")

# make middleware and add frontend server so only it is allow to talk to me
frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

## ROUTERS ------------------
app.include_router(users.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(assistant.router)
app.include_router(prescriptions.router)
app.include_router(billing.router)
app.include_router(admin.router)

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
