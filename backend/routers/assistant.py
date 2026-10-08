import logging
import os
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

import httpx
from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator

from database.connection import Database
from routers.users import authenticated_token_claims

router = APIRouter(prefix="/assistant", tags=["assistant"])
logger = logging.getLogger(__name__)
db = Database()

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.3-70b-versatile"
RATE_LIMIT_REQUESTS = 30
RATE_LIMIT_WINDOW_SECONDS = 60
_request_times: dict[str, list[float]] = {}
_rate_limit_lock = threading.Lock()

SYSTEM_INSTRUCTIONS = """You are the official AI Clinical Health Assistant for Sanjeevni Super-Specialty Clinic & Hospital.
Help patients navigate healthcare services: finding doctors, checking appointment availability, booking visits,
viewing digital prescriptions, understanding lab tests, checking bed status, and hospital timings.

Clinical safety guidelines:
1. For life-threatening emergencies (severe chest pain, breathing difficulty, stroke symptoms, unconsciousness, heavy trauma),
   immediately advise calling Sanjeevni Trauma Hotline (+91 9999-108-108) or visiting the 24x7 Emergency Command Bay.
2. Provide general health education in clear, empathetic language. Do not provide definitive diagnosis or prescribe controlled medication.
3. Guide users to relevant hospital departments:
   - Dr. Rajesh Sharma: MD, Chief Cardiologist (Fee: ₹800)
   - Dr. Priya Verma: MD, Dermatologist & Cosmetologist (Fee: ₹650)
   - Dr. Amit Gupta: MBBS, MD, General Medicine & Diabetology (Fee: ₹500)
   - Dr. Anita Roy: DM, Neurologist (Fee: ₹900)
   - Dr. Vikram Sethi: MD, Senior Pediatrician (Fee: ₹600)
   - Dr. Meera Iyer: MS, Orthopedic Surgeon (Fee: ₹750)
4. Hospital Timings: OPD Morning: 09:00 AM - 01:00 PM | Evening: 05:00 PM - 08:00 PM | Emergency & Trauma: 24 Hours Open.
5. Location: Sanjeevni Medical Pavilion, Central Health Boulevard."""


class LegacyChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    message: Optional[str] = None
    messages: Optional[List[LegacyChatMessage]] = None
    session_id: Optional[str] = None
    conversation_id: Optional[int] = None


def check_rate_limit(client_key: str) -> None:
    now = time.monotonic()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    with _rate_limit_lock:
        if len(_request_times) > 4096:
            stale_keys = [
                key for key, stamps in _request_times.items()
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


def get_intelligent_clinical_reply(user_text: str) -> str:
    lower_msg = user_text.lower().strip()

    # 1. Emergency Red-Flag Screening
    emergency_keywords = ["chest pain", "heart attack", "can't breathe", "breathless", "unconscious", "stroke", "paralysis", "bleeding heavily", "suicide", "poison"]
    if any(k in lower_msg for k in emergency_keywords):
        return (
            "🚨 **CRITICAL MEDICAL ALERT**: Your symptoms may indicate an acute medical emergency.\n\n"
            "• Please call **Sanjeevni 24x7 Trauma Hotline: +91 9999-108-108** immediately.\n"
            "• If in immediate danger, proceed directly to the **Emergency Command Center Bay** at Sanjeevni Hospital.\n"
            "• Do not drive yourself. Have someone escort you or await ALS Ambulance dispatch."
        )

    # 2. Doctor Specialties & Recommendations
    if any(k in lower_msg for k in ["heart", "cardio", "bp", "blood pressure", "palpitation"]):
        return (
            "❤️ **Cardiology Department**:\n"
            "• **Dr. Rajesh Sharma, MD (Cardiology)** is available for consultation.\n"
            "• Consultation Fee: **₹800** | Cabin 1.\n"
            "• Timings: Mon–Sat 09:00 AM – 01:00 PM & 05:00 PM – 08:00 PM.\n"
            "You can book an immediate 30-minute slot under the **'Find Care'** section."
        )

    if any(k in lower_msg for k in ["skin", "acne", "rash", "hair", "dermatol"]):
        return (
            "🌿 **Dermatology & Skin Care**:\n"
            "• **Dr. Priya Verma, MD (Dermatology)** specializes in clinical dermatology and aesthetic care.\n"
            "• Consultation Fee: **₹650** | Cabin 2.\n"
            "• You can book a consultation slot in the **'Find Care'** directory."
        )

    if any(k in lower_msg for k in ["child", "baby", "kid", "pediatric", "fever child", "infant"]):
        return (
            "👶 **Pediatrics Department**:\n"
            "• **Dr. Vikram Sethi, MD (Pediatrics)** treats infant care, childhood infections, and immunizations.\n"
            "• Consultation Fee: **₹600** | Cabin 5.\n"
            "• For baby vaccinations, visit the **'Vaccine Passport'** module for the complete UIP immunization schedule."
        )

    if any(k in lower_msg for k in ["bone", "joint", "fracture", "knee", "spine", "ortho"]):
        return (
            "🦴 **Orthopedics & Joint Care**:\n"
            "• **Dr. Meera Iyer, MS (Orthopedics)** specializes in joint trauma, spine health, and arthroscopy.\n"
            "• Consultation Fee: **₹750** | Cabin 6."
        )

    if any(k in lower_msg for k in ["fever", "cough", "cold", "general", "diabetes", "sugar"]):
        return (
            "🩺 **General Medicine & Diabetology**:\n"
            "• **Dr. Amit Gupta, MD (General Medicine)** provides expert comprehensive medical consultations.\n"
            "• Consultation Fee: **₹500** | Cabin 3.\n"
            "• Timings: 09:00 AM – 01:00 PM & 05:00 PM – 08:00 PM."
        )

    # 3. Booking Appointments
    if any(k in lower_msg for k in ["book", "appointment", "slot", "schedule", "timing", "hours"]):
        return (
            "📅 **How to Book at Sanjeevni Clinic**:\n"
            "1. Click on **'Find Care / Doctors'** in the navigation bar.\n"
            "2. Select your specialist and choose an available consultation date.\n"
            "3. Pick an open **30-minute consultation slot**.\n"
            "4. Complete confirmation via PhonePe Dynamic UPI QR or pay at the clinic reception counter."
        )

    # 4. Prescriptions & Lab Reports
    if any(k in lower_msg for k in ["prescription", "rx", "medicine", "pharmacy"]):
        return (
            "💊 **Digital Prescriptions (Rx) & Pharmacy**:\n"
            "• Following every doctor visit, an authorized digital prescription is instantly posted to your **'Health Records / Prescriptions'** tab.\n"
            "• You can download the PDF or show the digital seal directly at the Sanjeevni Central Pharmacy for batch-verified dispensation."
        )

    if any(k in lower_msg for k in ["lab", "blood test", "report", "pathology", "test result"]):
        return (
            "🔬 **Diagnostic Pathology & Lab Reports**:\n"
            "• Access your complete lab history under **'Diagnostic Lab Reports'**.\n"
            "• Tests include CBC, Lipid Profile, HbA1c, Thyroid, Renal function, and Liver panels.\n"
            "• Any critical abnormal values are automatically highlighted with clinical alerts."
        )

    # 5. Beds & Inpatient
    if any(k in lower_msg for k in ["bed", "icu", "admit", "admission", "ward", "ipd"]):
        return (
            "🛏️ **Inpatient Bed Availability (IPD)**:\n"
            "• Sanjeevni Pavilion maintains 20 monitored beds across ICU, Semi-Private, and General Wards.\n"
            "• Check real-time ward telemetry and oxygen status under the **'Hospital Bed Census'** section."
        )

    # 6. Billing & Payments
    if any(k in lower_msg for k in ["bill", "fee", "cost", "phonepe", "upi", "gst", "receipt"]):
        return (
            "💳 **Billing & Payment Clearance**:\n"
            "• Consultation fees range between **₹500 and ₹900**.\n"
            "• Payments are settled via **PhonePe Dynamic Merchant QR**, UPI, Debit/Credit Cards, or cash counter.\n"
            "• Instant official GST-exempt receipts (SJ-REC) are generated per Entry 74 Notification 12/2017-CT(R)."
        )

    # Default Greeting / Clinical Orientation
    return (
        "Welcome to **Sanjeevni Clinic AI Health Assistant**!\n\n"
        "I can help you with:\n"
        "• Finding specialist doctors and checking availability\n"
        "• Booking an OPD consultation slot\n"
        "• Accessing your digital prescriptions & lab reports\n"
        "• Checking bed occupancy and emergency services\n\n"
        "How may I assist your health journey today?"
    )


@router.post("/chat")
async def chat(
    request: Request,
    payload: ChatRequest,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    check_rate_limit(request.client.host if request.client else "unknown")

    # Extract user message
    user_message = ""
    if payload.message and payload.message.strip():
        user_message = payload.message.strip()
    elif payload.messages and len(payload.messages) > 0:
        user_message = payload.messages[-1].content.strip()

    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message content cannot be blank.",
        )

    # Resolve User ID if logged in
    user_id = None
    if authorization:
        try:
            claims = authenticated_token_claims(authorization)
            user_id = claims.get("id")
        except Exception:
            pass

    # Resolve or generate Session ID (indexed for scale)
    session_id = payload.session_id or f"sess_{uuid.uuid4().hex[:16]}"
    conversation_id = payload.conversation_id

    # 1. Get or create conversation in DB
    try:
        if conversation_id:
            conv = db.query(
                "SELECT id FROM chat_conversations WHERE id = %s",
                (conversation_id,),
                decision="fetchone",
            )
            if not conv:
                conversation_id = None

        if not conversation_id:
            # Check if open conversation exists for user_id or session_id
            if user_id:
                conv = db.query(
                    """
                    SELECT id FROM chat_conversations
                    WHERE user_id = %s
                    ORDER BY updated_at DESC LIMIT 1
                    """,
                    (user_id,),
                    decision="fetchone",
                )
            else:
                conv = db.query(
                    """
                    SELECT id FROM chat_conversations
                    WHERE session_id = %s
                    ORDER BY updated_at DESC LIMIT 1
                    """,
                    (session_id,),
                    decision="fetchone",
                )

            if conv:
                conversation_id = conv["id"]
            else:
                # Insert new conversation
                new_conv = db.query(
                    """
                    INSERT INTO chat_conversations (user_id, session_id, title)
                    VALUES (%s, %s, %s)
                    RETURNING id
                    """,
                    (user_id, session_id, user_message[:60]),
                    decision="fetchone",
                )
                conversation_id = new_conv["id"] if new_conv else 1

        # 2. Store user message in DB
        db.query(
            """
            INSERT INTO chat_messages (conversation_id, sender, message)
            VALUES (%s, 'user', %s)
            """,
            (conversation_id, user_message),
        )
    except Exception as e:
        logger.error(f"Failed to persist user chat message: {e}")

    # 3. Generate response: Try Groq API or fallback to Clinical Intelligence Engine
    reply = ""
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        try:
            model = os.getenv("GROQ_MODEL", DEFAULT_MODEL)
            async with httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=4.0)) as client:
                res = await client.post(
                    GROQ_API_URL,
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": SYSTEM_INSTRUCTIONS},
                            {"role": "user", "content": user_message},
                        ],
                        "temperature": 0.3,
                        "max_tokens": 500,
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    candidate = data["choices"][0]["message"]["content"]
                    if candidate and candidate.strip():
                        reply = candidate.strip()
        except Exception as exc:
            logger.warning(f"Groq API call failed, using clinical fallback: {exc}")

    if not reply:
        reply = get_intelligent_clinical_reply(user_message)

    # 4. Store bot response in DB
    msg_id = None
    try:
        bot_msg = db.query(
            """
            INSERT INTO chat_messages (conversation_id, sender, message)
            VALUES (%s, 'bot', %s)
            RETURNING id
            """,
            (conversation_id, reply),
            decision="fetchone",
        )
        msg_id = bot_msg["id"] if bot_msg else None

        db.query(
            "UPDATE chat_conversations SET updated_at = NOW() WHERE id = %s",
            (conversation_id,),
        )
    except Exception as e:
        logger.error(f"Failed to persist bot chat reply: {e}")

    return {
        "reply": reply,
        "conversation_id": conversation_id,
        "session_id": session_id,
        "message_id": msg_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/history")
def get_chat_history(
    session_id: Optional[str] = None,
    conversation_id: Optional[int] = None,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    user_id = None
    if authorization:
        try:
            claims = authenticated_token_claims(authorization)
            user_id = claims.get("id")
        except Exception:
            pass

    target_conv_id = conversation_id
    if not target_conv_id:
        if user_id:
            conv = db.query(
                "SELECT id FROM chat_conversations WHERE user_id = %s ORDER BY updated_at DESC LIMIT 1",
                (user_id,),
                decision="fetchone",
            )
            target_conv_id = conv["id"] if conv else None
        elif session_id:
            conv = db.query(
                "SELECT id FROM chat_conversations WHERE session_id = %s ORDER BY updated_at DESC LIMIT 1",
                (session_id,),
                decision="fetchone",
            )
            target_conv_id = conv["id"] if conv else None

    if not target_conv_id:
        return {"conversation_id": None, "messages": []}

    messages = db.query(
        """
        SELECT id, sender, message, timestamp
        FROM chat_messages
        WHERE conversation_id = %s
        ORDER BY timestamp ASC
        LIMIT 200
        """,
        (target_conv_id,),
        decision="fetchall",
    ) or []

    formatted_messages = [
        {
            "id": m["id"],
            "role": "assistant" if m["sender"] == "bot" else "user",
            "sender": m["sender"],
            "content": m["message"],
            "timestamp": m["timestamp"].isoformat() if hasattr(m["timestamp"], "isoformat") else str(m["timestamp"]),
        }
        for m in messages
    ]

    return {
        "conversation_id": target_conv_id,
        "session_id": session_id,
        "messages": formatted_messages,
    }


@router.delete("/history")
def clear_chat_history(
    session_id: Optional[str] = None,
    conversation_id: Optional[int] = None,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    user_id = None
    if authorization:
        try:
            claims = authenticated_token_claims(authorization)
            user_id = claims.get("id")
        except Exception:
            pass

    deleted_count = 0
    if conversation_id:
        deleted = db.query("DELETE FROM chat_conversations WHERE id = %s RETURNING id", (conversation_id,), decision="fetchall")
        deleted_count = len(deleted) if deleted else 0
    elif user_id:
        deleted = db.query("DELETE FROM chat_conversations WHERE user_id = %s RETURNING id", (user_id,), decision="fetchall")
        deleted_count = len(deleted) if deleted else 0
    elif session_id:
        deleted = db.query("DELETE FROM chat_conversations WHERE session_id = %s RETURNING id", (session_id,), decision="fetchall")
        deleted_count = len(deleted) if deleted else 0

    return {"status": "success", "message": "Conversation history cleared successfully.", "deleted_conversations": deleted_count}
