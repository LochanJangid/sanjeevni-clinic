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
from routers import clinical
from database.connection import Database

app = FastAPI(title="Sanjeevni Clinic SaaS API", version="2.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

## ROUTERS ------------------
app.include_router(users.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(assistant.router)
app.include_router(prescriptions.router)
app.include_router(billing.router)
app.include_router(admin.router)
app.include_router(clinical.router)

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
