# Sanjeevni Clinic

A patient-facing clinic portal built with Next.js, FastAPI, and PostgreSQL.

## Current patient experience

- Browse the clinic's doctor directory and consultation fees.
- Check generated appointment times, book a visit, and review appointment history.
- Cancel or reschedule eligible upcoming appointments.
- View and update patient contact details.
- Ask the Groq-powered website assistant about using the portal and general health topics.

The site does not currently provide clinical records, prescriptions, online payments, or a pharmacy storefront. The assistant is not a diagnostic service and does not access patient records or perform appointment actions.

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `DATABASE_URL_POOLED` and a private random `SECRET_KEY` in `backend/.env`. Set `GROQ_API_KEY` to enable the assistant; without it, other clinic pages still work and the assistant returns a clear unavailable response. Never commit `.env` or a real API key.

Start the API from `backend/`:

```bash
uvicorn app.main:app --reload
```

### Frontend

In `frontend/.env.local`, set:

```dotenv
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

For a deployed frontend, set `FRONTEND_ORIGINS` on the API to the exact comma-separated frontend origins. Do not use a wildcard when credentials are enabled.

## Scheduling notes

The existing database schema does not include per-doctor availability or appointment duration fields. Until that model is supplied, the API uses a shared 09:00–17:00 daily schedule and 30-minute slots. The API rechecks availability inside a PostgreSQL transaction and serializes bookings for the same doctor and day. Configure real clinic hours and doctor-specific days off before using the scheduler operationally.

## Groq assistant and privacy

The browser calls the clinic API; only the API reads `GROQ_API_KEY` and contacts Groq. Chat history stays in page memory and is not stored by this application. Messages sent to the assistant are forwarded to Groq to generate a reply. The chat UI warns users not to share private medical information.

The assistant is limited to website guidance and general health education. It does not read appointments, book or change visits, diagnose, prescribe, or replace a clinician. Configure the Groq key and review the provider's data-handling terms before enabling the assistant for patients.
