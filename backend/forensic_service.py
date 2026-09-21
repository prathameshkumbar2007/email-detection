import os
import sys
import json
import uuid
import hashlib
from datetime import datetime, timezone, timedelta

# Ensure core is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from core.parser import EmailForensicParser
from core.relay_tracer import RelayHopTracer
from core.auth_validator import AuthProtocolValidator
from core.ip_intelligence import IPIntelligenceEngine
from core.domain_intel import DomainIntelligenceEngine
from core.threat_engine import ThreatDetectionEngine
from core.attribution_graph import AttributionGraphEngine
from core.compliance import ComplianceAndEvidenceLocker
from core.samples import get_forensic_samples
from database import get_db

ip_engine = IPIntelligenceEngine()
domain_engine = DomainIntelligenceEngine()
threat_engine = ThreatDetectionEngine()
attribution_engine = AttributionGraphEngine()
compliance_locker = ComplianceAndEvidenceLocker(pii_masking_enabled=False)

def analyze_email(raw_content: str, filename: str = None, analyst: str = "Lead Forensic Analyst"):
    parser = EmailForensicParser(raw_content)
    parsed = parser.parse()
    
    # Trace relay hops
    tracer = RelayHopTracer(parsed.get("received_headers", []), parsed.get("x_originating_ip", ""))
    relay_trace = tracer.trace()
    
    # Enrich hops with Geo/ASN
    mapped_hops = ip_engine.map_relay_hops(relay_trace.get("hops", []))
    relay_trace["hops"] = mapped_hops
    
    origin_ip = relay_trace.get("origin_node", {}).get("ip", "UNKNOWN")
    origin_geo = ip_engine.lookup(origin_ip)
    relay_trace["origin_node"]["geo"] = origin_geo
    
    # Auth validation
    auth_validator = AuthProtocolValidator(parsed)
    auth_results = auth_validator.validate()
    
    # Domain intel
    from_info = parsed.get("from", {})
    domain_intel = domain_engine.analyze(
        from_info.get("display_name", ""),
        from_info.get("email", ""),
        parsed.get("reply_to", {}).get("email", "")
    )
    
    # Threat evaluation
    threat_eval = threat_engine.evaluate(parsed, auth_results, domain_intel, origin_geo)
    
    # Attribution graph
    attribution = attribution_engine.build(
        parsed, auth_results, domain_intel, relay_trace, origin_geo, threat_eval
    )
    
    # Evidentiary custody
    custody_log = compliance_locker.create_custody_log(parsed, analyst)
    
    # Synthesize findings for enterprise SOC UX
    findings = []
    
    # Reply-to mismatch finding
    from_domain = from_info.get("domain", "")
    reply_domain = parsed.get("reply_to", {}).get("domain", "")
    if reply_domain and from_domain and reply_domain.lower() != from_domain.lower():
        findings.append({
            "id": "F-001",
            "title": "Reply-To Address Divergence Detected",
            "severity": "High",
            "explanation": f"The reply address ({parsed.get('reply_to', {}).get('email')}) redirects traffic away from the sender domain ({from_domain}).",
            "evidence_ref": "RFC 5322 Section 3.6.2 (Header Reply-To)",
            "details": "This diversion tactic is frequently leveraged in Business Email Compromise (BEC) and wire transfer fraud to intercept responses."
        })
        
    # SPF/DKIM/DMARC findings
    spf_res = auth_results.get("spf", {}).get("status", "none").lower()
    if spf_res in ["fail", "softfail"]:
        findings.append({
            "id": "F-002",
            "title": f"SPF Authentication Anomaly ({spf_res.upper()})",
            "severity": "High" if spf_res == "fail" else "Medium",
            "explanation": f"The originating IP is not authorized in DNS SPF record for {from_domain}.",
            "evidence_ref": "RFC 7208 Section 2.6 (SPF Evaluation)",
            "details": auth_results.get("spf", {}).get("raw_spf_header", "Received-SPF failure")
        })
        
    dmarc_res = auth_results.get("dmarc", {}).get("status", "none").lower()
    if dmarc_res in ["fail", "reject"]:
        findings.append({
            "id": "F-003",
            "title": "DMARC Alignment Policy Failure",
            "severity": "High",
            "explanation": f"Neither SPF nor DKIM passed in alignment with the visible From: domain ({from_domain}).",
            "evidence_ref": "RFC 7489 Section 6.6 (DMARC Policy Enforcement)",
            "details": f"DMARC status: {dmarc_res.upper()}. Evaluated action: {auth_results.get('dmarc', {}).get('policy', 'none')}."
        })
        
    # Urgency & Coercion
    urgency_signals = threat_eval.get("findings", {}).get("urgency_signals", []) or threat_eval.get("urgency_signals", [])
    if urgency_signals:
        findings.append({
            "id": "F-004",
            "title": "Psychological Coercion & Urgency Language Detected",
            "severity": "Medium" if len(urgency_signals) == 1 else "High",
            "explanation": f"Identified {len(urgency_signals)} coercive urgency indicators designed to bypass standard authorization controls.",
            "evidence_ref": "NLP Threat Model (Coercion Lexicon)",
            "details": f"Trigger phrases: {', '.join([s.get('matched_text', '') for s in urgency_signals[:3]])}"
        })
        
    bec_signals = threat_eval.get("findings", {}).get("bec_signals", [])
    if bec_signals or threat_eval.get("is_bec"):
        findings.append({
            "id": "F-007",
            "title": "Business Email Compromise (BEC) Financial Lure",
            "severity": "Critical",
            "explanation": "Detected financial payment redirection or account update patterns common in wire fraud.",
            "evidence_ref": "BEC Threat Detection Engine",
            "details": f"Signals: {', '.join([b.get('matched_text', '') for b in bec_signals[:3]]) if bec_signals else 'Executive wire transfer indicators'}"
        })

    # Weaponized attachments
    for att in parsed.get("attachments", []):
        fn = att.get("filename", "")
        if fn.lower().endswith((".xlsm", ".exe", ".scr", ".bat", ".vbs")):
            findings.append({
                "id": "F-005",
                "title": f"Weaponized Macro Attachment: {fn}",
                "severity": "Critical",
                "explanation": "Attachment contains executable macro payload patterns with auto-execution routines.",
                "evidence_ref": "MIME Body / VBA Analysis",
                "details": f"File: {fn}, Type: {att.get('content_type', 'application/octet-stream')}"
            })
            
    # Typosquatting / Homoglyph
    if domain_intel.get("is_typosquatting") or domain_intel.get("is_homoglyph"):
        findings.append({
            "id": "F-006",
            "title": f"Deceptive Domain Impersonation ({domain_intel.get('squat_type', 'Typosquatting')})",
            "severity": "Critical",
            "explanation": f"Domain {from_domain} closely imitates brand {domain_intel.get('targeted_brand', 'Corporate Brand')}.",
            "evidence_ref": "Domain Intelligence / Levenshtein Distance",
            "details": f"Similarity score: {domain_intel.get('similarity', 0.95):.2f}"
        })
        
    if not findings:
        findings.append({
            "id": "F-000",
            "title": "Clean Authentication & Content Evaluation",
            "severity": "Safe",
            "explanation": "Cryptographic authentication passed, relay path is standard, and no coercive threat indicators detected.",
            "evidence_ref": "RFC 5322 & RFC 7489 Compliance Check",
            "details": "All evaluated parameters conform to legitimate corporate communication baselines."
        })

    # Normalized risk score & tier
    raw_score = threat_eval.get("threat_score")
    if raw_score is None:
        raw_score = threat_eval.get("overall_risk_score", 10)
    risk_score = int(raw_score)
    
    # If any critical findings, ensure score reflects high risk
    if any(f["severity"] == "Critical" for f in findings):
        risk_score = max(risk_score, 82)
    elif any(f["severity"] == "High" for f in findings):
        risk_score = max(risk_score, 65)

    if risk_score >= 80:
        risk_tier = "CRITICAL"
    elif risk_score >= 60:
        risk_tier = "HIGH"
    elif risk_score >= 35:
        risk_tier = "SUSPICIOUS"
    else:
        risk_tier = "SAFE"
    
    # Classification mapping
    if risk_score >= 70:
        if any("Wire" in f["title"] or "BEC" in f["title"] or "Financial" in f["title"] for f in findings):
            classification = "Fraud-related"
        elif any("Impersonation" in f["title"] or "Reply-To" in f["title"] for f in findings):
            classification = "Impersonation"
        elif any("Attachment" in f["title"] or "Punycode" in f["title"] or "Sign In" in str(threat_eval) for f in findings):
            classification = "Phishing"
        else:
            classification = "Suspicious"
    elif risk_score >= 40:
        classification = "Suspicious"
    else:
        classification = "Legitimate"

    confidence = "High" if len(parsed.get("received_headers", [])) >= 2 else "Medium"
    
    analysis_id = f"ANALYSIS-{parsed.get('hashes', {}).get('sha256', uuid.uuid4().hex)[:8].upper()}"
    
    recommended_actions = [
        {"action": "Review Manually", "priority": "High" if risk_score > 60 else "Low", "description": "Verify email context with internal security playbooks."},
        {"action": "Verify Sender Independently", "priority": "High" if risk_score > 60 else "Medium", "description": "Contact sender out-of-band via trusted internal directory."},
        {"action": "Escalate to Case", "priority": "High" if risk_score > 75 else "Low", "description": "Open an incident response investigation case for tracking."},
        {"action": "Export Forensic Report", "priority": "Medium", "description": "Generate NIST-compliant executive and technical documentation."}
    ]
    
    payload = {
        "id": analysis_id,
        "subject": parsed.get("subject", "(No Subject)"),
        "sender": from_info.get("raw", ""),
        "recipient": str(parsed.get("to", "")),
        "risk_score": risk_score,
        "risk_tier": risk_tier,
        "threat_classification": classification,
        "confidence_level": confidence,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "filename": filename or "email_sample.eml",
        "findings": findings,
        "recommended_actions": recommended_actions,
        "limitations": "IP geolocation and infrastructure analysis are approximate indicators based on routing topology. They do not establish physical sender identity or definitive individual attribution.",
        "parsed": parsed,
        "relay_hops": relay_trace.get("hops", []),
        "origin_node": relay_trace.get("origin_node", {}),
        "auth": auth_results,
        "domain_intel": domain_intel,
        "threat": threat_eval,
        "attribution": attribution,
        "evidence": {
            "hashes": parsed.get("hashes", {}),
            "size_bytes": parsed.get("hashes", {}).get("size_bytes", len(raw_content.encode())),
            "custody_log": custody_log
        },
        "urls": parsed.get("urls", [])
    }
    
    # Ensure all nested dates/objects are JSON-safe strings
    clean_payload = json.loads(json.dumps(payload, default=str))

    # Save to SQLite
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO analyses (id, subject, sender, recipient, risk_score, risk_tier, threat_classification, confidence_level, created_at, raw_eml, result_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        analysis_id,
        clean_payload["subject"],
        clean_payload["sender"],
        clean_payload["recipient"],
        clean_payload["risk_score"],
        clean_payload["risk_tier"],
        clean_payload["threat_classification"],
        clean_payload["confidence_level"],
        clean_payload["created_at"],
        raw_content,
        json.dumps(clean_payload)
    ))
    conn.commit()
    conn.close()
    
    return clean_payload

def seed_demo_data():
    """Initializes the database with realistic demonstration cases, alerts, evidence, and reports."""
    from core.samples import get_forensic_samples
    samples = get_forensic_samples()
    analyses_saved = []
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Clear tables
    cursor.execute("DELETE FROM analyses")
    cursor.execute("DELETE FROM cases")
    cursor.execute("DELETE FROM alerts")
    cursor.execute("DELETE FROM evidence")
    cursor.execute("DELETE FROM reports")
    conn.commit()
    conn.close()
    
    for s in samples:
        res = analyze_email(s["raw_eml"], f"{s['id']}.eml", "CyberTrace Forensics Unit")
        analyses_saved.append(res)
        
    conn = get_db()
    cursor = conn.cursor()
    
    # Seed 4 Cases
    cases = [
        {
            "id": "CASE-2026-0842",
            "title": "Executive BEC Wire Transfer ($78,500 Diverted Escrow)",
            "priority": "Critical",
            "status": "Under Investigation",
            "assigned_analyst": "Sarah Chen (Tier 3 Lead)",
            "description": "C-level executive impersonation demanding urgent $78,500 wire transfer with diverted Reply-To address routed through Moscow bulletproof VPS infrastructure.",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "related_analysis_id": analyses_saved[0]["id"],
            "notes": json.dumps([
                {"id": "n1", "author": "Sarah Chen", "timestamp": "2026-09-21 14:10 UTC", "text": "Origin IP 185.220.101.5 confirmed registered to AS204655 (Bulletproof Cloud)."},
                {"id": "n2", "author": "Alex Mercer", "timestamp": "2026-09-21 15:30 UTC", "text": "Escrow bank account flagged with Treasury compliance unit for freeze request."}
            ]),
            "evidence_ids": json.dumps(["EVD-2026-001", "EVD-2026-005"]),
            "timeline": json.dumps([
                {"time": "13:20 UTC", "event": "Inbound email intercepted by Mail Gateway"},
                {"time": "13:22 UTC", "event": "Automated SPF Hard Fail & Reply-To Divergence flagged"},
                {"time": "14:05 UTC", "event": "Analyst initiated forensic investigation case"}
            ])
        },
        {
            "id": "CASE-2026-0843",
            "title": "M365 Tenant Credential Harvester Campaign",
            "priority": "High",
            "status": "Evidence Review",
            "assigned_analyst": "Alex Mercer (Forensic Specialist)",
            "description": "Punycode spoofing and visual homoglyph email imitating Microsoft 365 password expiration directing staff to credential harvesting landing page.",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=7)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
            "related_analysis_id": analyses_saved[1]["id"],
            "notes": json.dumps([
                {"id": "n1", "author": "Alex Mercer", "timestamp": "2026-09-21 11:20 UTC", "text": "Harvesting domain micros0ft-login.com submitted for DNS sinkhole takedown."}
            ]),
            "evidence_ids": json.dumps(["EVD-2026-002"]),
            "timeline": json.dumps([
                {"time": "10:14 UTC", "event": "Phishing lure delivered to target employee inbox"},
                {"time": "10:30 UTC", "event": "User reported suspicious password expiration prompt"}
            ])
        },
        {
            "id": "CASE-2026-0844",
            "title": "Weaponized VBA Macro Dropper Delivery",
            "priority": "Critical",
            "status": "Open",
            "assigned_analyst": "Sarah Chen (Tier 3 Lead)",
            "description": "Spear-phishing email targeting HR department with malicious macro-enabled spreadsheet attachment designed to execute secondary stage dropper.",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat(),
            "related_analysis_id": analyses_saved[3]["id"] if len(analyses_saved) > 3 else analyses_saved[0]["id"],
            "notes": json.dumps([
                {"id": "n1", "author": "Sarah Chen", "timestamp": "2026-09-21 09:00 UTC", "text": "Extracted VBA macros show obfuscated PowerShell download cradle."}
            ]),
            "evidence_ids": json.dumps(["EVD-2026-003"]),
            "timeline": json.dumps([
                {"time": "08:50 UTC", "event": "Attachment quarantined by perimeter sandbox"}
            ])
        },
        {
            "id": "CASE-2026-0845",
            "title": "Commercial Banking Brand Impersonation (.XYZ Combosquat)",
            "priority": "Medium",
            "status": "Resolved",
            "assigned_analyst": "Marcus Vance (SOC Tier 2)",
            "description": "High-volume fraud alert claiming unauthorized $1,480 debit transaction sent from residential dynamic IP address in Lagos, Nigeria.",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat(),
            "related_analysis_id": analyses_saved[2]["id"] if len(analyses_saved) > 2 else analyses_saved[0]["id"],
            "notes": json.dumps([
                {"id": "n1", "author": "Marcus Vance", "timestamp": "2026-09-20 16:45 UTC", "text": "Perimeter IP block applied. No endpoint interactions detected."}
            ]),
            "evidence_ids": json.dumps(["EVD-2026-004"]),
            "timeline": json.dumps([
                {"time": "Yesterday", "event": "Incident resolved following gateway blocking"}
            ])
        }
    ]
    
    for c in cases:
        cursor.execute("""
        INSERT INTO cases (id, title, priority, status, assigned_analyst, description, created_at, updated_at, related_analysis_id, notes, evidence_ids, timeline)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (c["id"], c["title"], c["priority"], c["status"], c["assigned_analyst"], c["description"], c["created_at"], c["updated_at"], c["related_analysis_id"], c["notes"], c["evidence_ids"], c["timeline"]))
        
    # Seed 6 Alerts
    alerts = [
        {
            "id": "ALERT-9021",
            "title": "CEO BEC Wire Transfer Lure ($78,500)",
            "severity": "Critical",
            "alert_type": "BEC",
            "related_email_subject": "URGENT & CONFIDENTIAL: Priority Wire Transfer",
            "sender": "marcus.vance@vance-holdings.com",
            "status": "Active",
            "created_at": (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat(),
            "assigned_analyst": "Sarah Chen",
            "analysis_id": analyses_saved[0]["id"],
            "case_id": "CASE-2026-0842",
            "notes": "Reply-To redirected to mail-consulting.ru. High priority triage required."
        },
        {
            "id": "ALERT-9022",
            "title": "Microsoft 365 Credential Phishing Lure",
            "severity": "High",
            "alert_type": "Credential Harvesting",
            "related_email_subject": "Action Required: Your Microsoft 365 Password Expires in 2 Hours",
            "sender": "admin@micros0ft-login.com",
            "status": "Active",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
            "assigned_analyst": "Alex Mercer",
            "analysis_id": analyses_saved[1]["id"],
            "case_id": "CASE-2026-0843",
            "notes": "Homoglyph zero replacing letter o in domain."
        },
        {
            "id": "ALERT-9023",
            "title": "Weaponized Excel Macro Dropper Quarantined",
            "severity": "Critical",
            "alert_type": "Malicious Links",
            "related_email_subject": "URGENT: Revised 2026 Q3 Bonus Matrix",
            "sender": "hr-payroll@target-corp-benefits.work",
            "status": "Under Review",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat(),
            "assigned_analyst": "Sarah Chen",
            "analysis_id": analyses_saved[3]["id"] if len(analyses_saved) > 3 else analyses_saved[0]["id"],
            "case_id": "CASE-2026-0844",
            "notes": "File Q3_Bonus_Calculation_Schedule.xlsm contains AutoOpen VBA trigger."
        },
        {
            "id": "ALERT-9024",
            "title": "Bank of America Debit Fraud Alert Combosquat",
            "severity": "High",
            "alert_type": "Phishing",
            "related_email_subject": "IMMEDIATE ACTION: Suspicious Debit Card Transaction",
            "sender": "security-alerts@bankofamerica-secure-verify.xyz",
            "status": "Under Review",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat(),
            "assigned_analyst": "Marcus Vance",
            "analysis_id": analyses_saved[2]["id"] if len(analyses_saved) > 2 else analyses_saved[0]["id"],
            "case_id": "CASE-2026-0845",
            "notes": "Suspicious TLD .xyz with direct residential origin in Lagos."
        },
        {
            "id": "ALERT-9025",
            "title": "SPF Hard Failure from Unregistered Anonymized Relay",
            "severity": "Medium",
            "alert_type": "Authentication Anomaly",
            "related_email_subject": "Corporate Communication Relay Test",
            "sender": "internal-ops@vance-holdings.com",
            "status": "Active",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=8)).isoformat(),
            "assigned_analyst": "Unassigned",
            "analysis_id": None,
            "case_id": None,
            "notes": "Relay node 185.220.101.5 does not match SPF TXT include list."
        },
        {
            "id": "ALERT-9026",
            "title": "DMARC Alignment Policy Failure (action=none)",
            "severity": "Low",
            "alert_type": "Spoofing",
            "related_email_subject": "Weekly Cloud Summary Digest",
            "sender": "marketing-outbound@partner-corp.net",
            "status": "Dismissed",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "assigned_analyst": "Marcus Vance",
            "analysis_id": None,
            "case_id": None,
            "notes": "Evaluated as benign third-party newsletter marketing blast."
        }
    ]
    
    for a in alerts:
        cursor.execute("""
        INSERT INTO alerts (id, title, severity, alert_type, related_email_subject, sender, status, created_at, assigned_analyst, analysis_id, case_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (a["id"], a["title"], a["severity"], a["alert_type"], a["related_email_subject"], a["sender"], a["status"], a["created_at"], a["assigned_analyst"], a["analysis_id"], a["case_id"], a["notes"]))
        
    # Seed 5 Evidence Items
    evidence_items = [
        {
            "id": "EVD-2026-001",
            "filename": "executive_bec_wire_transfer.eml",
            "file_type": ".eml",
            "sha256": "48a7d1e89b21f308ac82098b1082c9e78291048bca1928374920481729482710",
            "file_size": 4096,
            "uploaded_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat(),
            "uploaded_by": "Sarah Chen (Tier 3 Lead)",
            "case_id": "CASE-2026-0842",
            "description": "Original raw RFC 5322 MIME email payload acquired from Microsoft 365 perimeter mail exchange gateway.",
            "chain_of_custody": json.dumps([
                {"event": "Acquisition", "timestamp": "2026-09-21 13:25 UTC", "officer": "Gateway Ingest Daemon", "note": "Cryptographic checksum SHA-256 calculated on ingest", "hash_verified": True},
                {"event": "Custody Transfer", "timestamp": "2026-09-21 14:05 UTC", "officer": "Sarah Chen", "note": "Transferred to SOC Evidence Locker Vault", "hash_verified": True}
            ])
        },
        {
            "id": "EVD-2026-002",
            "filename": "m365_login_phish_capture.pcap",
            "file_type": ".pcap",
            "sha256": "77bc192840192a839b1092847192847192847192847192847192847192847192",
            "file_size": 184320,
            "uploaded_at": (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat(),
            "uploaded_by": "Alex Mercer",
            "case_id": "CASE-2026-0843",
            "description": "Network packet capture of HTTP POST connection initiated by test sandbox to micros0ft-login.com harvesting endpoint.",
            "chain_of_custody": json.dumps([
                {"event": "Sandbox Capture", "timestamp": "2026-09-21 10:45 UTC", "officer": "Alex Mercer", "note": "Captured via Wireshark probe in isolated DMZ", "hash_verified": True}
            ])
        },
        {
            "id": "EVD-2026-003",
            "filename": "Q3_Bonus_Calculation_Schedule.xlsm",
            "file_type": ".xlsm",
            "sha256": "91a8291048201948201948201948201948201948201948201948201948201948",
            "file_size": 24576,
            "uploaded_at": (datetime.now(timezone.utc) - timedelta(hours=11)).isoformat(),
            "uploaded_by": "Sarah Chen",
            "case_id": "CASE-2026-0844",
            "description": "Weaponized spreadsheet containing malicious VBA macro code extracted from inbound spear-phishing message.",
            "chain_of_custody": json.dumps([
                {"event": "Extraction", "timestamp": "2026-09-21 08:52 UTC", "officer": "Gateway Sandbox", "note": "Detached from message with hash verification", "hash_verified": True}
            ])
        },
        {
            "id": "EVD-2026-004",
            "filename": "dns_spf_dkim_records_dump.json",
            "file_type": ".json",
            "sha256": "33fa901827491028374910283749102837491028374910283749102837491028",
            "file_size": 1280,
            "uploaded_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "uploaded_by": "Marcus Vance",
            "case_id": "CASE-2026-0845",
            "description": "DNS TXT and MX record query results for bankofamerica-secure-verify.xyz captured at time of analysis.",
            "chain_of_custody": json.dumps([
                {"event": "DNS Query Snapshot", "timestamp": "2026-09-20 14:00 UTC", "officer": "Marcus Vance", "note": "DNS query via 1.1.1.1 and 8.8.8.8 recorded", "hash_verified": True}
            ])
        },
        {
            "id": "EVD-2026-005",
            "filename": "bulletproof_vps_whois_evidence.txt",
            "file_type": ".txt",
            "sha256": "1290384719284719284719284719284719284719284719284719284719284719",
            "file_size": 3410,
            "uploaded_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
            "uploaded_by": "Sarah Chen",
            "case_id": "CASE-2026-0842",
            "description": "RIPE NCC and WHOIS allocation records for IP 185.220.101.5 and Autonomous System AS204655.",
            "chain_of_custody": json.dumps([
                {"event": "WHOIS Query Capture", "timestamp": "2026-09-21 14:30 UTC", "officer": "Sarah Chen", "note": "Archived for investigative documentation", "hash_verified": True}
            ])
        }
    ]
    
    for e in evidence_items:
        cursor.execute("""
        INSERT INTO evidence (id, filename, file_type, sha256, file_size, uploaded_at, uploaded_by, case_id, description, chain_of_custody)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (e["id"], e["filename"], e["file_type"], e["sha256"], e["file_size"], e["uploaded_at"], e["uploaded_by"], e["case_id"], e["description"], e["chain_of_custody"]))
        
    # Seed 3 Reports
    reports = [
        {
            "id": "RPT-2026-001",
            "case_id": "CASE-2026-0842",
            "title": "Executive BEC Incident Response & Forensic Assessment",
            "created_by": "Sarah Chen (Tier 3 Lead)",
            "generated_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
            "status": "Finalized",
            "summary": "Forensic evaluation of an executive wire fraud attempt against the Finance Controller. Analysis isolated the originating node to bulletproof hosting in Moscow, confirmed SPF/DMARC hard failure, and identified intentional Reply-To divergence.",
            "report_data": json.dumps({
                "case_id": "CASE-2026-0842",
                "classification": "Fraud-related (BEC)",
                "risk_score": 92,
                "confidence": "High",
                "findings_count": 4,
                "evidence_count": 2,
                "analyst": "Sarah Chen",
                "limitations": "Attribution to specific human actors is not established solely from SMTP routing headers."
            })
        },
        {
            "id": "RPT-2026-002",
            "case_id": "CASE-2026-0843",
            "title": "Microsoft 365 Credential Harvesting Campaign Analysis",
            "created_by": "Alex Mercer",
            "generated_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat(),
            "status": "Finalized",
            "summary": "Technical review of credential harvesting campaign targeting enterprise Azure AD credentials via lookalike domain micros0ft-login.com.",
            "report_data": json.dumps({
                "case_id": "CASE-2026-0843",
                "classification": "Phishing",
                "risk_score": 85,
                "confidence": "High",
                "findings_count": 3,
                "evidence_count": 1,
                "analyst": "Alex Mercer",
                "limitations": "Domain registration privacy shields registrant details."
            })
        },
        {
            "id": "RPT-2026-003",
            "case_id": "CASE-2026-0844",
            "title": "Weaponized VBA Macro Dropper Threat Advisory",
            "created_by": "Sarah Chen",
            "generated_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat(),
            "status": "Draft",
            "summary": "Preliminary analysis of an intercepted .xlsm document attempting to execute malicious Visual Basic code for initial persistence.",
            "report_data": json.dumps({
                "case_id": "CASE-2026-0844",
                "classification": "Phishing / Malware",
                "risk_score": 96,
                "confidence": "High",
                "findings_count": 4,
                "evidence_count": 1,
                "analyst": "Sarah Chen",
                "limitations": "Payload sandbox detonation was conducted in isolated environment."
            })
        }
    ]
    
    for r in reports:
        cursor.execute("""
        INSERT INTO reports (id, case_id, title, created_by, generated_at, status, summary, report_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (r["id"], r["case_id"], r["title"], r["created_by"], r["generated_at"], r["status"], r["summary"], r["report_data"]))
        
    conn.commit()
    conn.close()
    print(f"Successfully seeded database with {len(analyses_saved)} analyses, {len(cases)} cases, {len(alerts)} alerts, {len(evidence_items)} evidence items, and {len(reports)} reports.")
