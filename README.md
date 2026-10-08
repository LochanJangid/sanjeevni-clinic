# 🏥 Sanjeevni Clinic — Unified Clinical Operating System & Healthcare ERP

A production-grade, high-concurrency clinical hospital management system engineered for **Sanjeevni Medical Pavilion**. Designed for scalable deployment across hundreds of thousands of patients, doctors, and hospital administrators with strict role isolation, real-time WebRTC teleconsultations, dynamic live OPD queue signage with Web Audio chimes, and executive hospital ERP controls.

---

## 🎨 Clinical Color Palette & Design Identity

The interface adheres strictly to a clean, traditional medical design system with generous whitespace, structured readability, and clear visual hierarchy:

- **Primary Background & Structure (60%)**: `#FFFFFF` (Pure White) — Signals cleanliness, structural order, and clinical healing.
- **Secondary Headings & Navigation (30%)**: `#1E3A8A` (Navy Blue) — Evokes stability, institutional credibility, and physician authority.
- **Accent Action Buttons & Links (10%)**: `#0D9488` (Teal Blue) — Guides patient focus safely to critical clinical actions without visual fatigue.
- **Neutral Typography & Borders**: `#4B5563` (Muted Slate Grey) — Ensures safe, high-contrast reading without stark black tones.
- **Responsive Viewport Enclosure**: Every popup, appointment drawer, and onboarding modal is scrollable within screen bounds (`max-h-[90vh] overflow-y-auto`).

---

## 🔐 Default Access Credentials

| Role | Username / Access Method | Password / Key | Scope & Capabilities |
| :--- | :--- | :--- | :--- |
| **Hospital Administrator** | `lochan` | `admin` | Full ERP oversight, Doctor CRUD, POS Cash Drawer, Pharmacy Stock, Bed Telemetry, PhonePe QR reconciliation. |
| **Specialist Doctors** | Unique Doctor Access Key (e.g. `DOC-RAJESH-8192`) | *(Direct Key Sign-In or Password)* | Physician Cockpit, Isolated OPD Queue, 1-Click Rx Protocols, Bed Allocation, On-Behalf Pharmacy Orders, WebRTC Teleconsult. |
| **Patients** | Mobile / Registered Username | Password | Free open self-registration, booking, PhonePe payments, P2P video teleconsult, Rx downloads, lab reports, AI assistant. |

---

## 🚀 Key Modules & Architecture

### 1. Role-Isolated Clinical Portals
- **Strict Tenant & Role Separation**: Patients, doctors, and administrators only access their respective operational interfaces. No patient can execute doctor actions; no doctor can manipulate another doctor's queue cabin or hospital-wide financial drawers.
- **Dynamic Perspective Home**: The landing page dynamically recognizes the user's role and renders a tailored operational dashboard with instant dispatch shortcuts.

### 2. Live WebRTC Teleconsultation System
- **Real P2P Audio/Video Streams**: Built on native WebRTC (`getUserMedia`, `RTCPeerConnection`, STUN servers `stun:stun.l.google.com:19302`).
- **Dynamic Participant Detail Extraction**: Automatically fetches authenticated clinician and patient records from PostgreSQL—no hardcoded placeholders or mock buttons.
- **In-Call Clinical Workstation**:
  - Real-time microphone mute/unmute and camera toggle.
  - Screen sharing via `navigator.mediaDevices.getDisplayMedia` for reviewing diagnostic scans and EHR charts.
  - Doctor clinical notes pad with instant digital prescription generation.
  - Live patient vitals snapshot (BP, SpO2, Heart Rate, Glucose) and longitudinal telemetry link.

### 3. Smart OPD Queue & TV Hall Signage Display
- **Cabin Isolation**: Doctors can only manage their own cabin's queue, check in their assigned patients, and call their own tokens.
- **Web Audio Hospital Chime**: Authentic two-tone dual oscillator chime (E5 $\rightarrow$ C5) plays over the waiting room TV signage upon token dispatch.
- **1-Minute Patient Absent / Push-to-End Requeueing**:
  - Calling a patient starts a 60-second real-time countdown timer.
  - **"Patient Arrived? (Yes)"**: Confirms patient entry into the chamber and activates the consultation session.
  - **"Patient Absent? (Push to End & Call Next)"**: If the patient fails to report within 1 minute, the doctor moves them to the very end of today's queue (`MAX(token_number) + 1`), notifies the patient, and immediately calls the next waiting patient.
  - **"Conclude Session (Yes)"**: Marks the consultation complete, releases the chamber, archives the appointment, and alerts the patient.

### 4. Admin Doctor Management (Full CRUD)
- **Doctor Faculty Roster**: Hospital admin can view all registered specialists, departments, consultation fees, and active login keys.
- **Appoint Specialist Doctor**: Onboard clinicians with custom or auto-generated keys (`DOC-NAME-XXXX`), assign categories, fees, degrees, experience, and chamber address.
- **Edit Doctor Profile**: Real-time modal update of doctor credentials, consultation fees, and access keys.
- **Safe Doctor Decommissioning**: Safe deletion with automated foreign key disassociation across appointments, beds, queue tokens, prescriptions, and lab records without database crashes.

### 5. Inpatient Department (IPD) Bed Occupancy Telemetry
- **Patient Perspective**: Transparent, view-only real-time occupancy map of ICU, General, HDU, and Emergency beds with vacant/occupied status indicators.
- **Doctor Perspective**: Direct bed request and admission allocation for patients needing hospitalization.
- **Admin Perspective**: Full admission, bed transfer, and patient discharge workflow.

### 6. Official PhonePe & UPI Billing Gateway
- **Centralized Admin PhonePe Account**: Direct integration with UPI ID `7240499165-2@ybl` and phone number `7240499165`.
- **Dynamic QR Code Generation**: Generates official Bharat QR / UPI intents for fee collection.
- **Payment Verification Gate**: Admin validates receipt status before dispatching clinic tokens.

### 7. Pharmacy Inventory & Point-of-Sale (POS)
- **Full Inventory Stock CRUD**: Manage medicine catalog, categories, dosage forms, price, stock quantity, batch numbers, and expiry dates.
- **Doctor On-Behalf Prescribing**: Attending physicians can order medications directly on behalf of patients, appending them to their hospital invoice.
- **Cash Drawer Reconciler**: Daily cash drawer sessions tracking opening float, cash collected, UPI/card intake, expected totals, and closing discrepancies.
- **Bulk CSV / Excel Import**: Fast bulk ingestion of pharmaceuticals into clinic inventory.

### 8. AI Clinical Assistant & Triage Engine
- **Powered by Groq Cloud (Llama-3.3-70B-Versatile)**:
  - Clinical symptom triage identifying emergency red flags (e.g. crushing chest pain, acute respiratory distress) with high-priority warnings.
  - Persistent chat history and conversational memory for lakhs of patients.
  - Website navigation guidance and clinic operational assistance.

---

## 🛠️ Technology Stack

```
sanjeevni-clinic/
├── frontend/                     # Next.js 16 Web Application (App Router)
│   ├── app/                      # Routes, Layouts, Server & Client Components
│   │   ├── admin/                # Executive Hospital ERP & Doctor CRUD
│   │   ├── doctor-portal/        # Physician Cockpit & Prescription Writer
│   │   ├── opd-queue/            # Waiting Hall TV Signage & Queue Controller
│   │   ├── teleconsult/          # WebRTC Virtual Consultation Suites
│   │   ├── appointments/         # Slot Booking & Schedule Dispatch
│   │   ├── pharmacy/             # Medicine Catalog & Inventory Desk
│   │   ├── beds/                 # Inpatient Bed Occupancy Telemetry
│   │   ├── vitals/               # Patient Longitudinal Health Metrics
│   │   ├── lab-reports/          # Diagnostic Barcode & Test Records
│   │   └── prescriptions/        # Electronic Prescriptions Archive
│   ├── lib/                      # Auth, Hospital Config & API Utilities
│   └── public/                   # Static Clinic Assets & Branding
│
├── backend/                      # High-Concurrency FastAPI REST Service
│   ├── app/                      # Main Application Entrypoint & Middleware
│   ├── routers/                  # Modular Sub-Routers
│   │   ├── admin.py              # Doctor CRUD, Cash Drawer, Stats, Bulk Imports
│   │   ├── clinical.py           # WebRTC Signaling, OPD Queue, Beds, Triage
│   │   ├── prescriptions.py      # Prescription Protocols & Dispensing
│   │   ├── pharmacy.py           # Stock Management & Orders
│   │   ├── appointments.py       # Slot Serialization & Booking
│   │   ├── doctors.py            # Availability & Specialties
│   │   ├── users.py              # Auth, JWT, Roles & Registration
│   │   └── chatbot.py            # AI Conversational Assistant & Groq Engine
│   └── database/                 # PostgreSQL Connection Pool & Schema Scripts
```

---

## 📡 API Reference Overview

| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/auth/login` | `POST` | Public | Standard login with username & password |
| `/auth/doctor-key-login` | `POST` | Doctor | Quick physician sign-in using Doctor Access Key |
| `/admin/stats` | `GET` | Admin | Real-time hospital metrics (patients, doctors, revenue) |
| `/admin/doctors-with-keys` | `GET` | Admin | Retrieves all doctors and credentials |
| `/admin/appoint-doctor` | `POST` | Admin | Onboard new specialist & generate Doctor Access Key |
| `/admin/doctors/{id}` | `PUT` | Admin | Update doctor credentials, category, fees, key |
| `/admin/doctors/{id}` | `DELETE` | Admin | Safe decommissioning with foreign key disassociation |
| `/clinical/opd-queue/live` | `GET` | Public | Live OPD queue status for TV signage |
| `/clinical/opd-queue/call-next/{id}` | `POST` | Doctor/Admin | Call next waiting token with Web Audio chime |
| `/clinical/opd-queue/confirm-arrival/{id}` | `POST` | Doctor/Admin | Doctor confirms "Patient Arrived (Yes)" |
| `/clinical/opd-queue/push-to-end/{id}` | `POST` | Doctor/Admin | Push absent patient to queue end & call next |
| `/clinical/opd-queue/complete-current/{id}` | `POST` | Doctor/Admin | Conclude consultation & notify patient |
| `/clinical/opd-queue/check-in` | `POST` | Staff | Check in patient to waiting queue |
| `/clinical/teleconsult/session-details/{id}` | `GET` | Authenticated | Retrieve real participant & consultation details |
| `/clinical/teleconsult/signal` | `POST` | Authenticated | Send WebRTC SDP offer, answer, or ICE candidate |
| `/clinical/teleconsult/signals/{id}` | `GET` | Authenticated | Poll peer WebRTC signals |
| `/clinical/beds/status` | `GET` | Public | Live inpatient bed census & occupancy |
| `/clinical/beds/request` | `POST` | Doctor/Admin | Allocate or request hospital bed for patient |
| `/clinical/pharmacy/order-on-behalf` | `POST` | Doctor | Prescribe and order medicines on patient bill |
| `/prescriptions/create` | `POST` | Doctor | Issue formal electronic prescription with protocol |
| `/clinical/triage` | `POST` | Public | AI clinical symptom evaluation & red-flag triage |

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **Python**: v3.11+
- **PostgreSQL**: v14+

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cat <<EOF > .env
DATABASE_URL_POOLED=postgresql://user:password@localhost:5432/sanjeevni_db
SECRET_KEY=your-super-secret-jwt-key
GROQ_API_KEY=your-groq-api-key
EOF

# Start FastAPI application server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Configure local environment
cat <<EOF > .env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
EOF

# Start Next.js development server
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🛡️ Production & Scalability Best Practices
- **Connection Pooling**: Uses `psycopg_pool` to handle thousands of concurrent queries without database connection exhaustion.
- **Peer-to-Peer Video Media**: Video streams bypass server bandwidth bottlenecks, flowing directly between browser peers via WebRTC with Google STUN failovers.
- **Index Optimization**: Composite indexes on `opd_tokens(doctor_id, token_date, status)`, `appointments(doctor_id, appointment_date)`, and `teleconsult_signals(appointment_id)`.
- **Zero-Crash Foreign Key Integrity**: Complete referential cleanup cascades when modifying or removing medical faculty.

---

## 📜 License
Developed for **Sanjeevni Clinic & Medical Pavilion**. Proprietary clinical operating software. All rights reserved.
