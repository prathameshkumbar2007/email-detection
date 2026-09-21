# CyberTrace AI
> **Intelligent Email Threat Detection & Forensic Intelligence**

CyberTrace AI is a functional, enterprise-grade Security Operations Center (SOC) dashboard and forensic analysis platform. It combines deep RFC 5322 header parsing, multi-hop SMTP relay tracing, SPF/DKIM/DMARC alignment validation, BGP Autonomous System (ASN) and IP geolocation enrichment, typosquatting/homoglyph detection, natural language threat scoring, interactive infrastructure attack graphing, and NIST SP 800-86 aligned evidentiary custody tracking.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python**: 3.9 or higher
- **Node.js**: v18 or higher (with npm)

---

### 2. Backend Setup
Navigate to the `backend/` directory and install dependencies:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The FastAPI backend will start at:
- **API Base**: `http://127.0.0.1:8000`
- **Swagger Documentation**: `http://127.0.0.1:8000/docs`
- **Database**: Initialized automatically as `backend/cybertrace.db` (pre-seeded with realistic scenarios).

---

### 3. Frontend Setup
In a new terminal window, navigate to `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at:
- **Application URL**: `http://127.0.0.1:5173/`

*(All API requests to `/api/*` are automatically proxied to `http://127.0.0.1:8000/api/*` via Vite)*.

---

## 🛡️ Key Features & Modules

1. **Executive SOC Dashboard** (`/dashboard`): Threat distribution meters, active investigation counters, recent incidents, real-time telemetry ticker.
2. **Deep Email Forensics** (`/analyze`): Raw RFC 5322 eml text editor, 6-stage animated analysis pipeline, 0–100 radial threat score gauge, expandable finding cards with RFC/NIST citations.
3. **Header Forensics & Authentication Alignment** (`/headers`): Received hops chronological breakdown with hop latency calculations, SPF/DKIM/DMARC alignment validator.
4. **Infrastructure Geolocation & Relay Path** (`/geolocation`): Interactive vector world map plotting relay routing vectors and pulsing origin node, complete with ASN details and forensic limitation notice.
5. **Threat Intelligence & IOC Cross-Correlation** (`/threat-intel`): Multi-type IOC query engine (IP, Domain, URL, Hash, Email), reputation scores, detection ratios, simulated threat actor attribution, and defanged copy.
6. **Attack Infrastructure Forensics Graph** (`/graph`): SVG node-link forensic graph with zoom/pan controls, type filtering, and node inspector side-drawer.
7. **Incident Case Management** (`/cases`): Case tracking, status/priority triage, case creation modal, chronological audit timeline, collaborative analyst notes log.
8. **Real-Time Security Alert Triage** (`/alerts`): Alert queue with review/escalate/dismiss actions.
9. **Forensic Reports Catalog** (`/reports`): Formal report generator and printable dossier modal adhering to strict separation between Observed Facts, Automated Findings, and Attribution Hypotheses.
10. **Cryptographic Evidence Vault** (`/evidence`): NIST SP 800-86 aligned evidentiary locker with SHA-256 integrity verification and custody logs.
11. **SOC Policy & System Settings** (`/settings`): Analyst credentials, PII auto-redaction policy, appearance modes.
12. **Global Command Palette (<kbd>Ctrl</kbd> + <kbd>K</kbd>)**: Global instant search across cases, email subjects, IPs, domains, and evidence digests.

---

## 📜 Scientific & Legal Disclaimers
- **IP Geolocation**: IP geolocation indicates approximate physical routing infrastructure (e.g. data centers, VPN egress nodes, cloud relays). It does NOT establish the true physical location or verified identity of the email sender.
- **Evidence Vault**: Demonstrates cryptographic chain-of-custody tracking aligned with NIST SP 800-86 standards for educational and prototyping purposes.
