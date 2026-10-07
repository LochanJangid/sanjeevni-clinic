import logging
import os
import threading
import time
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator

router = APIRouter(prefix="/assistant", tags=["assistant"])
logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.3-70b-versatile"
RATE_LIMIT_REQUESTS = 12
RATE_LIMIT_WINDOW_SECONDS = 60
_request_times: dict[str, list[float]] = {}
_rate_limit_lock = threading.Lock()

SYSTEM_INSTRUCTIONS = """You are the Sanjeevni Clinic website assistant.
Help people navigate this website: finding listed doctors, checking displayed appointment slots,
booking a visit, viewing appointment history, rescheduling or cancelling a visit, and updating
their patient contact profile. Explain that actions must be completed by the patient in the site;
never claim that you booked, changed, cancelled, or verified an appointment.

You may answer general health-education questions in plain language, but do not diagnose,
recommend a prescription, interpret an individual's test results, or replace a clinician.
Encourage the person to contact a qualified healthcare professional for personal medical advice.
For possible emergencies (including severe trouble breathing, chest pain, stroke symptoms,
uncontrolled bleeding, or immediate danger), tell them to contact local emergency services or
go to the nearest emergency department now.

Do not invent clinic hours, doctor qualifications, services, prices, payment options, or policies.
Use only facts provided in the conversation about the website. Do not ask for passwords,
payment details, medical record numbers, or unnecessary sensitive health information. Ask a
short clarifying question when it will help answer safely. Be warm, concise, and clear."""


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1200)

    @field_validator("content")
    @classmethod
    def require_non_blank_content(cls, content: str) -> str:
        trimmed = content.strip()
        if not trimmed:
            raise ValueError("Message cannot be blank.")
        return trimmed


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=12)

    @field_validator("messages")
    @classmethod
    def end_with_user_message(cls, messages: list[ChatMessage]) -> list[ChatMessage]:
        if messages[-1].role != "user":
            raise ValueError("The conversation must end with a user message.")
        return messages


def check_rate_limit(client_key: str) -> None:
    now = time.monotonic()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    with _rate_limit_lock:
        if len(_request_times) > 2048:
            stale_keys = [
                key
                for key, stamps in _request_times.items()
                if not any(stamp > cutoff for stamp in stamps)
            ]
            for key in stale_keys:
                del _request_times[key]

        active = [stamp for stamp in _request_times.get(client_key, []) if stamp > cutoff]
        if len(active) >= RATE_LIMIT_REQUESTS:
            _request_times[client_key] = active
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Please wait a moment before sending another message.",
            )
        active.append(now)
        _request_times[client_key] = active


@router.post("/chat")
async def chat(request: Request, payload: ChatRequest):
    check_rate_limit(request.client.host if request.client else "unknown")

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        last_msg = payload.messages[-1].content.lower()
        if "doctor" in last_msg or "specialist" in last_msg or "team" in last_msg:
            return {"reply": "Sanjeevni Clinic features experienced specialists across Cardiology (Dr. Rajesh Sharma), Dermatology (Dr. Priya Verma), General Medicine (Dr. Amit Gupta), Neurology (Dr. Anita Roy), Pediatrics (Dr. Vikram Sethi), and Orthopedics (Dr. Meera Iyer). You can explore their profiles and consultation fees on the 'Find care' page."}
        if "book" in last_msg or "slot" in last_msg or "time" in last_msg or "appointment" in last_msg:
            return {"reply": "To book an appointment, head to the 'Find care' tab, choose your specialist doctor, and click 'Choose a time'. Select a suitable calendar date to view all open 30-minute consultation slots."}
        if "fee" in last_msg or "cost" in last_msg or "price" in last_msg or "pay" in last_msg or "bill" in last_msg:
            return {"reply": "Doctor consultation fees range between ₹500 and ₹900 depending on the specialty. We support digital payments (UPI, Credit/Debit cards) as well as cash payments at the clinic front desk."}
        if "prescription" in last_msg or "medicine" in last_msg or "rx" in last_msg:
            return {"reply": "Once a doctor completes your consultation, your official digital prescription (Rx) with medicine dosages, schedules, and clinical guidance will be instantly available under 'My Health Records / Prescriptions'."}
        return {"reply": "Welcome to Sanjeevni Clinic! I can help guide you through booking appointments, viewing doctor schedules, reviewing digital prescriptions, or clinic policies. How may I help you today?"}

    model = os.getenv("GROQ_MODEL", DEFAULT_MODEL)
    messages = [
        {"role": "system", "content": SYSTEM_INSTRUCTIONS},
        *[message.model_dump() for message in payload.messages],
    ]

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(25.0, connect=5.0),
        ) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.3,
                    "max_tokens": 500,
                },
            )
        response.raise_for_status()
        response_data = response.json()
        reply = response_data["choices"][0]["message"]["content"]
        if not isinstance(reply, str) or not reply.strip():
            raise ValueError("The assistant returned an empty message.")
    except httpx.TimeoutException as exc:
        logger.warning("Groq assistant request timed out")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The assistant is taking too long to respond. Please try again.",
        ) from exc
    except httpx.HTTPStatusError as exc:
        remote_status = exc.response.status_code
        logger.warning("Groq assistant request failed with status %s", remote_status)
        if remote_status == 429:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The assistant is busy right now. Please try again shortly.",
            ) from exc
        if remote_status in (401, 403):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The clinic assistant is not available. Please contact the clinic for help.",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The assistant could not respond just now. Please try again.",
        ) from exc
    except (httpx.RequestError, KeyError, IndexError, TypeError, ValueError) as exc:
        logger.warning("Groq assistant request could not be completed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The assistant could not respond just now. Please try again.",
        ) from exc

    return {"reply": reply.strip()}
