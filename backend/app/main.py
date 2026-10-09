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
from routers import ipd
from routers import pharmacy_lab
from routers import dpdp
from routers import abdm
from database.connection import Database

import logging
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Sanjeevni Clinic SaaS API", version="2.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sanjeevni-clinic.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "error": str(exc)},
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
app.include_router(ipd.router)
app.include_router(pharmacy_lab.router)
app.include_router(dpdp.router)
app.include_router(abdm.router)

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
