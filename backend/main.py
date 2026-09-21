import os
import sys
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from fastapi import FastAPI, HTTPException, Query, Body, status
from fastapi.middleware.cors import CORSMiddleware

from database import get_db, init_db
from schemas import (
    EmailAnalyzeRequest, CaseCreateRequest, CaseUpdateRequest,
    AlertReviewRequest, EvidenceCreateRequest, ReportGenerateRequest
)
from forensic_service import analyze_email, seed_demo_data
from core.samples import get_forensic_samples

app = FastAPI(
    title="CyberTrace AI - Enterprise Threat Intelligence & Forensic Platform",
    description="Intelligent Email Threat Detection & Forensic Intelligence API",
    version="2.4.0-enterprise"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM analyses")
    count = cursor.fetchone()[0]
    conn.close()
    if count == 0:
        print("Database empty. Seeding realistic demo forensic data...")
        seed_demo_data()

# -------------------------------------------------------------
# System & Demo Endpoints
# -------------------------------------------------------------
@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "service": "CyberTrace AI Forensic Core",
        "version": "2.4.0-enterprise",
        "environment": "Simulated Demo Environment",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": "sqlite_operational",
            "rfc5322_parser": "active",
            "relay_tracer": "active",
            "threat_nlp": "active",
            "ip_intelligence": "active"
        }
    }

@app.get("/api/demo/samples")
def list_demo_samples():
    return get_forensic_samples()

@app.post("/api/demo/reset")
def reset_demo_environment():
    seed_demo_data()
    return {"success": True, "message": "Demo forensic environment reset to baseline state."}

# -------------------------------------------------------------
# Email Analysis Endpoints
# -------------------------------------------------------------
@app.post("/api/email/analyze")
def analyze_email_endpoint(req: EmailAnalyzeRequest):
    raw_content = req.eml_text
    if not raw_content:
        # Construct synthetic RFC 5322 from manual metadata
        from_hdr = req.from_addr or "unknown@external.net"
        to_hdr = req.to_addr or "analyst@target-corp.com"
        subj = req.subject or "Direct Ingest Analysis"
        msg_id = req.message_id or f"<{uuid.uuid4()}@manual-input.local>"
        date_hdr = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
        raw_content = f"""From: {from_hdr}
To: {to_hdr}
Subject: {subj}
Date: {date_hdr}
Message-ID: {msg_id}
"""
        if req.reply_to:
            raw_content += f"Reply-To: {req.reply_to}\n"
        if req.return_path:
            raw_content += f"Return-Path: {req.return_path}\n"
        raw_content += "\n(Manual metadata ingestion payload)\n"

    result = analyze_email(raw_content, req.filename or "uploaded_sample.eml")
    
    # Trigger active alert if risk score is elevated
    if result["risk_score"] >= 75:
        conn = get_db()
        cursor = conn.cursor()
        alert_id = f"ALERT-{uuid.uuid4().hex[:4].upper()}"
        cursor.execute("""
        INSERT INTO alerts (id, title, severity, alert_type, related_email_subject, sender, status, created_at, assigned_analyst, analysis_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            alert_id,
            f"High Risk Detection: {result['threat_classification']}",
            "Critical" if result["risk_score"] >= 85 else "High",
            result["threat_classification"],
            result["subject"],
            result["sender"],
            "Active",
            result["created_at"],
            "Automated Ingest Rule",
            result["id"],
            f"Triggered by Risk Score {result['risk_score']}/100. Findings: {len(result['findings'])}"
        ))
        conn.commit()
        conn.close()

    return result

@app.get("/api/email/analyses")
def list_email_analyses(limit: int = 50):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, subject, sender, recipient, risk_score, risk_tier, threat_classification, confidence_level, created_at FROM analyses ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/email/analyses/{analysis_id}")
def get_email_analysis(analysis_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT result_json FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return json.loads(row["result_json"])

# -------------------------------------------------------------
# Case Management Endpoints
# -------------------------------------------------------------
@app.post("/api/cases", status_code=status.HTTP_201_CREATED)
def create_case(req: CaseCreateRequest):
    case_id = f"CASE-{datetime.now().year}-{uuid.uuid4().hex[:4].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    timeline = json.dumps([
        {"time": "Just now", "event": f"Case created by {req.assigned_analyst}"}
    ])
    notes = json.dumps([])
    evidence_ids = json.dumps(req.evidence_ids or [])
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO cases (id, title, priority, status, assigned_analyst, description, created_at, updated_at, related_analysis_id, notes, evidence_ids, timeline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        case_id, req.title, req.priority, req.status, req.assigned_analyst,
        req.description, now_iso, now_iso, req.related_analysis_id, notes, evidence_ids, timeline
    ))
    conn.commit()
    conn.close()
    return {
        "id": case_id,
        "title": req.title,
        "priority": req.priority,
        "status": req.status,
        "assigned_analyst": req.assigned_analyst,
        "description": req.description,
        "created_at": now_iso,
        "updated_at": now_iso,
        "related_analysis_id": req.related_analysis_id,
        "evidence_ids": req.evidence_ids or []
    }

@app.get("/api/cases")
def list_cases(status_filter: Optional[str] = None, priority: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    query = "SELECT * FROM cases"
    params = []
    clauses = []
    if status_filter:
        clauses.append("status = ?")
        params.append(status_filter)
    if priority:
        clauses.append("priority = ?")
        params.append(priority)
    if clauses:
        query += " WHERE " + " AND ".join(clauses)
    query += " ORDER BY created_at DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    cases = []
    for r in rows:
        d = dict(r)
        d["notes"] = json.loads(d["notes"]) if d.get("notes") else []
        d["evidence_ids"] = json.loads(d["evidence_ids"]) if d.get("evidence_ids") else []
        d["timeline"] = json.loads(d["timeline"]) if d.get("timeline") else []
        cases.append(d)
    return cases

@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cases WHERE id = ?", (case_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")
    d = dict(row)
    d["notes"] = json.loads(d["notes"]) if d.get("notes") else []
    d["evidence_ids"] = json.loads(d["evidence_ids"]) if d.get("evidence_ids") else []
    d["timeline"] = json.loads(d["timeline"]) if d.get("timeline") else []
    return d

@app.patch("/api/cases/{case_id}")
def update_case(case_id: str, req: CaseUpdateRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cases WHERE id = ?", (case_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found")
        
    d = dict(row)
    notes = json.loads(d["notes"]) if d.get("notes") else []
    evidence_ids = json.loads(d["evidence_ids"]) if d.get("evidence_ids") else []
    timeline = json.loads(d["timeline"]) if d.get("timeline") else []
    
    now_iso = datetime.now(timezone.utc).isoformat()
    
    title = req.title or d["title"]
    priority = req.priority or d["priority"]
    status_val = req.status or d["status"]
    analyst = req.assigned_analyst or d["assigned_analyst"]
    description = req.description if req.description is not None else d["description"]
    
    if req.note:
        notes.append({
            "id": f"n-{uuid.uuid4().hex[:4]}",
            "author": analyst,
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            "text": req.note
        })
        timeline.append({"time": "Just now", "event": f"Analyst added note: {req.note[:30]}..."})
        
    if req.evidence_id and req.evidence_id not in evidence_ids:
        evidence_ids.append(req.evidence_id)
        timeline.append({"time": "Just now", "event": f"Associated evidence {req.evidence_id}"})
        
    if req.status and req.status != d["status"]:
        timeline.append({"time": "Just now", "event": f"Status changed to {req.status}"})
        
    cursor.execute("""
    UPDATE cases SET title=?, priority=?, status=?, assigned_analyst=?, description=?, updated_at=?, notes=?, evidence_ids=?, timeline=?
    WHERE id=?
    """, (title, priority, status_val, analyst, description, now_iso, json.dumps(notes), json.dumps(evidence_ids), json.dumps(timeline), case_id))
    conn.commit()
    conn.close()
    
    return {"id": case_id, "status": "updated", "updated_at": now_iso}

# -------------------------------------------------------------
# Alerts Endpoints
# -------------------------------------------------------------
@app.get("/api/alerts")
def list_alerts(severity: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    query = "SELECT * FROM alerts"
    params = []
    if severity:
        query += " WHERE severity = ?"
        params.append(severity)
    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/alerts/{alert_id}/review")
def review_alert(alert_id: str, req: AlertReviewRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert = dict(row)
    new_case_id = alert["case_id"]
    
    if req.create_case and not new_case_id:
        new_case_id = f"CASE-{datetime.now().year}-{uuid.uuid4().hex[:4].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
        INSERT INTO cases (id, title, priority, status, assigned_analyst, description, created_at, updated_at, related_analysis_id, notes, evidence_ids, timeline)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            new_case_id,
            f"Escalation: {alert['title']}",
            alert["severity"],
            "Open",
            req.assigned_analyst or "Lead Forensic Analyst",
            f"Automatically escalated from security alert {alert_id}. Reason: {req.reason or 'Threat triage'}",
            now_iso, now_iso, alert["analysis_id"],
            json.dumps([]), json.dumps([]),
            json.dumps([{"time": "Just now", "event": f"Escalated from alert {alert_id}"}])
        ))
        
    cursor.execute("""
    UPDATE alerts SET status = ?, case_id = ?, notes = ? WHERE id = ?
    """, (req.status, new_case_id, req.reason or alert["notes"], alert_id))
    conn.commit()
    conn.close()
    
    return {"id": alert_id, "status": req.status, "case_id": new_case_id}

# -------------------------------------------------------------
# Evidence Vault Endpoints
# -------------------------------------------------------------
@app.post("/api/evidence", status_code=status.HTTP_201_CREATED)
def create_evidence(req: EvidenceCreateRequest):
    ev_id = f"EVD-{datetime.now().year}-{uuid.uuid4().hex[:3].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # Calculate sha256
    content_bytes = req.content.encode() if req.content else b""
    sha256 = req.sha256 or hashlib.sha256(content_bytes).hexdigest()
    file_size = req.file_size or len(content_bytes)
    
    chain_of_custody = json.dumps([
        {
            "event": "Registration",
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            "officer": req.uploaded_by,
            "note": "Registered in Evidence Vault with cryptographic verification",
            "hash_verified": True
        }
    ])
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO evidence (id, filename, file_type, sha256, file_size, uploaded_at, uploaded_by, case_id, description, chain_of_custody)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ev_id, req.filename, req.file_type, sha256, file_size,
        now_iso, req.uploaded_by, req.case_id, req.description, chain_of_custody
    ))
    conn.commit()
    conn.close()
    
    return {
        "id": ev_id,
        "filename": req.filename,
        "file_type": req.file_type,
        "sha256": sha256,
        "file_size": file_size,
        "uploaded_at": now_iso,
        "uploaded_by": req.uploaded_by,
        "case_id": req.case_id,
        "description": req.description
    }

@app.get("/api/evidence")
def list_evidence():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM evidence ORDER BY uploaded_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    res = []
    for r in rows:
        d = dict(r)
        d["chain_of_custody"] = json.loads(d["chain_of_custody"]) if d.get("chain_of_custody") else []
        res.append(d)
    return res

@app.get("/api/evidence/{evidence_id}")
def get_evidence(evidence_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM evidence WHERE id = ?", (evidence_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Evidence item not found")
    d = dict(row)
    d["chain_of_custody"] = json.loads(d["chain_of_custody"]) if d.get("chain_of_custody") else []
    return d

# -------------------------------------------------------------
# Forensic Reports Endpoints
# -------------------------------------------------------------
@app.post("/api/reports/generate", status_code=status.HTTP_201_CREATED)
def generate_report(req: ReportGenerateRequest):
    rpt_id = f"RPT-{datetime.now().year}-{uuid.uuid4().hex[:3].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Pull case context if provided
    case_title = "Ad-Hoc Forensic Evaluation"
    classification = "Threat Assessment"
    risk_score = 75
    
    if req.case_id:
        cursor.execute("SELECT title, priority, related_analysis_id FROM cases WHERE id = ?", (req.case_id,))
        c = cursor.fetchone()
        if c:
            case_title = c["title"]
            
    report_data = {
        "report_id": rpt_id,
        "case_id": req.case_id,
        "title": req.title,
        "created_by": req.created_by,
        "timestamp": now_iso,
        "status": "Finalized",
        "case_title": case_title,
        "observed_facts": [
            "Inbound RFC 5322 payload received by enterprise border gateway.",
            "Cryptographic SPF and DKIM authentication evaluated against DNS zones.",
            "Originating node IP address resolved through Autonomous System routing tables."
        ],
        "automated_findings": [
            "NLP urgency scoring identified high-pressure deadline cues.",
            "Divergence detected between visible From: header and technical Return-Path."
        ],
        "interpretations": [
            "Indicators are consistent with Business Email Compromise (BEC) wire redirection tactics.",
            "Attack methodology aligns with opportunistic credential harvesting campaigns."
        ],
        "unavailable_evidence": [
            "Remote server memory dumps are unavailable without legal subpoena.",
            "Registrant identity protected behind privacy proxy shield."
        ],
        "limitations": "Findings are based strictly on available headers and technical artifacts. Attribution does not establish individual human identity."
    }
    
    summary_text = req.executive_summary or f"Forensic intelligence assessment for {req.title}. Identified key indicators and preserved chain of custody."
    
    cursor.execute("""
    INSERT INTO reports (id, case_id, title, created_by, generated_at, status, summary, report_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        rpt_id, req.case_id, req.title, req.created_by, now_iso, "Finalized", summary_text, json.dumps(report_data)
    ))
    conn.commit()
    conn.close()
    
    return {
        "id": rpt_id,
        "case_id": req.case_id,
        "title": req.title,
        "created_by": req.created_by,
        "generated_at": now_iso,
        "status": "Finalized",
        "summary": summary_text,
        "report_data": report_data
    }

@app.get("/api/reports")
def list_reports():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, case_id, title, created_by, generated_at, status, summary FROM reports ORDER BY generated_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/reports/{report_id}")
def get_report(report_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
    d = dict(row)
    d["report_data"] = json.loads(d["report_data"]) if d.get("report_data") else {}
    return d

# -------------------------------------------------------------
# Threat Intelligence Search
# -------------------------------------------------------------
@app.get("/api/intel/search")
def search_threat_intel(q: str = Query(..., description="IP, Domain, URL, Hash, or Email")):
    query_str = q.strip()
    
    # Static realistic IOC knowledgebase
    known_iocs = {
        "185.220.101.5": {
            "indicator": "185.220.101.5",
            "indicator_type": "IP Address",
            "source": "AbuseIPDB & RIPE NCC",
            "reputation": "Malicious / Bulletproof Hosting",
            "confidence": 94,
            "first_seen": "2026-08-12",
            "last_seen": "2026-09-21",
            "asn": "AS204655 (Bulletproof Cloud Ltd)",
            "country": "Russia",
            "related_cases": ["CASE-2026-0842"],
            "source_freshness": "Real-time cache"
        },
        "micros0ft-login.com": {
            "indicator": "micros0ft-login.com",
            "indicator_type": "Domain",
            "source": "Passive DNS & DomainTools",
            "reputation": "Credential Harvester (Lookalike Phishing)",
            "confidence": 98,
            "first_seen": "2026-09-18",
            "last_seen": "2026-09-21",
            "asn": "AS16276 (OVH SAS)",
            "country": "Seychelles / Offshore",
            "related_cases": ["CASE-2026-0843"],
            "source_freshness": "Updated 2 hours ago"
        },
        "bankofamerica-secure-verify.xyz": {
            "indicator": "bankofamerica-secure-verify.xyz",
            "indicator_type": "Domain",
            "source": "OpenPhish & URLHaus",
            "reputation": "Combosquat Phishing Portal",
            "confidence": 91,
            "first_seen": "2026-09-19",
            "last_seen": "2026-09-20",
            "asn": "AS36873",
            "country": "Nigeria",
            "related_cases": ["CASE-2026-0845"],
            "source_freshness": "Updated yesterday"
        },
        "102.89.23.114": {
            "indicator": "102.89.23.114",
            "indicator_type": "IP Address",
            "source": "MaxMind GeoIP2",
            "reputation": "Suspicious Residential Node",
            "confidence": 78,
            "first_seen": "2026-09-02",
            "last_seen": "2026-09-20",
            "asn": "AS37148 (Globacom Ltd)",
            "country": "Nigeria",
            "related_cases": ["CASE-2026-0845"],
            "source_freshness": "Updated 1 day ago"
        }
    }
    
    if query_str in known_iocs:
        return known_iocs[query_str]
        
    # Dynamic heuristic response for any searched indicator
    is_ip = any(c.isdigit() for c in query_str) and "." in query_str and not any(c.isalpha() for c in query_str)
    is_email = "@" in query_str
    is_hash = len(query_str) in [32, 40, 64] and all(c in "0123456789abcdefABCDEF" for c in query_str)
    
    itype = "IP Address" if is_ip else ("Email Address" if is_email else ("File Hash" if is_hash else "Domain/URL"))
    
    return {
        "indicator": query_str,
        "indicator_type": itype,
        "source": "Simulated Global SOC Threat Feed",
        "reputation": "Unclassified / Low Suspicion",
        "confidence": 60,
        "first_seen": "2026-09-01",
        "last_seen": "2026-09-21",
        "asn": "AS15169 (Google LLC)" if is_ip else "N/A",
        "country": "United States",
        "related_cases": [],
        "source_freshness": "Simulated local feed"
    }

# -------------------------------------------------------------
# Global Infrastructure Graph Data
# -------------------------------------------------------------
@app.get("/api/graph/data")
def get_global_infrastructure_graph():
    nodes = [
        {"id": "c1", "label": "CASE-2026-0842 (BEC Wire)", "type": "case", "risk": "critical"},
        {"id": "c2", "label": "CASE-2026-0843 (M365 Phish)", "type": "case", "risk": "high"},
        {"id": "e1", "label": "marcus.vance@vance-holdings.com", "type": "email", "risk": "suspicious"},
        {"id": "e2", "label": "marcus.vance.exec@mail-consulting.ru", "type": "email", "risk": "critical"},
        {"id": "d1", "label": "vance-holdings.com", "type": "domain", "risk": "legitimate"},
        {"id": "d2", "label": "mail-consulting.ru", "type": "domain", "risk": "critical"},
        {"id": "d3", "label": "micros0ft-login.com", "type": "domain", "risk": "critical"},
        {"id": "ip1", "label": "185.220.101.5", "type": "ip", "risk": "critical"},
        {"id": "ip2", "label": "194.180.174.10", "type": "ip", "risk": "medium"},
        {"id": "ip3", "label": "197.234.242.18", "type": "ip", "risk": "high"},
        {"id": "srv1", "label": "mx.enterprise-gateway.com", "type": "mail_server", "risk": "safe"},
        {"id": "url1", "label": "http://197.234.242.18/login/sso", "type": "url", "risk": "critical"}
    ]
    links = [
        {"source": "c1", "target": "e1", "relation": "associated_with"},
        {"source": "e1", "target": "e2", "relation": "diverts_to"},
        {"source": "e2", "target": "d2", "relation": "resolves_to"},
        {"source": "e2", "target": "ip1", "relation": "relayed_through"},
        {"source": "ip1", "target": "srv1", "relation": "transmitted_to"},
        {"source": "c2", "target": "d3", "relation": "associated_with"},
        {"source": "d3", "target": "url1", "relation": "hosts"},
        {"source": "url1", "target": "ip3", "relation": "resolves_to"}
    ]
    return {"nodes": nodes, "links": links}
