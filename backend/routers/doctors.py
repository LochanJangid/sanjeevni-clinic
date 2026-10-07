from fastapi import APIRouter
from pydantic import BaseModel
from database.connection import Database

router = APIRouter(prefix="/doctors", tags=["doctors"])

db = Database()

## SCHEMA -------------------
class Doctors(BaseModel):
    name: str

## GET ALL DOCTORS ------------
@router.get("/get_doctors")
def get_doctors():
    doctors_list = db.query("SELECT * FROM doctors",query_params=tuple(), decision="fetchall")
    return doctors_list