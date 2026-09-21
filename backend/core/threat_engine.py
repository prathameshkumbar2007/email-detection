"""
AI NLP and Heuristic Threat Detection Engine
Analyzes email linguistics, urgency cues, BEC payment diversion patterns,
credential harvesting lures, suspicious URLs, and attachment triage.
Calculates a weighted composite risk score (0-100) and classification.
"""

import re
from urllib.parse import urlparse


class ThreatDetectionEngine:
    """Linguistic and structural email threat analyzer."""

    # Urgency & coercion triggers
    URGENCY_PATTERNS = [
        (r'\b(?:immediate(?:ly)?|urgent(?:ly)?|prompt(?:ly)?)\b', 15, "Explicit Urgency Modifier"),
        (r'\b(?:within (?:24|48|12|2|1) hours?|today only|right now|by end of day)\b', 20, "Artificial Time Restriction"),
        (r'\b(?:account (?:suspend(?:ed)?|terminat(?:ed)?|locked|disabled|closed))\b', 25, "Coercive Account Threat"),
        (r'\b(?:confidential(?:ity)?|keep this (?:between us|private)|do not discuss)\b', 20, "Isolation / Secrecy Pressure"),
        (r'\b(?:in a meeting|cannot take calls?|traveling|reach me via email only)\b', 15, "Channel Restriction Excuse"),
        (r'\b(?:final notice|action required|immediate response)\b', 15, "Demanding Action Stance")
    ]

    # BEC / Financial fraud cues
    BEC_PATTERNS = [
        (r'\b(?:wire transfer|wire funds?|ach transfer|bank transfer|remittance)\b', 30, "Wire / Electronic Fund Transfer Request"),
        (r'\b(?:new bank details?|updated banking instructions?|change (?:of|in) bank account)\b', 40, "Payment Diversion / Account Rerouting"),
        (r'\b(?:swift code|iban|routing number|account number|beneficiary name)\b', 25, "Bank Account Routing Fields"),
        (r'\b(?:vendor invoice|outstanding payment|overdue invoice|payment remittance)\b', 20, "Fake Invoice Lure"),
        (r'\b(?:gift cards?|apple cards?|steam cards?|itunes cards?)\b', 35, "Gift Card Purchase Demand"),
        (r'\b(?:processed immediately|release the payment|settle the balance)\b', 20, "Payment Pressure Cues"),
        (r'\b(?:\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d{1,3}(?:,\d{3})*\s*(?:usd|eur|gbp))\b', 15, "Explicit Monetary Amount Quoted")
    ]

    # Credential harvesting patterns
    CREDENTIAL_PATTERNS = [
        (r'\b(?:verify your (?:account|identity|password|credentials?))\b', 25, "Credential Verification Request"),
        (r'\b(?:password (?:expir(?:ed|es|ing)|reset|has been compromised))\b', 25, "Password Expiry Notice"),
        (r'\b(?:click here to (?:log\s*in|sign\s*in|unlock|confirm|update))\b', 25, "Direct Action Call to Sign In"),
        (r'\b(?:re-?authenticate|session expired|storage limit exceeded)\b', 20, "Session Expiry Deception")
    ]

    DANGEROUS_EXTENSIONS = {
        ".exe", ".bat", ".cmd", ".scr", ".vbs", ".js", ".wsf", ".ps1",
        ".hta", ".iso", ".img", ".jar", ".cpl", ".msc"
    }

    MACRO_EXTENSIONS = {
        ".docm", ".xlsm", ".pptm", ".dotm", ".xltm"
    }

    URL_SHORTENERS = {
        "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "ow.ly",
        "buff.ly", "rebrand.ly", "goo.gl", "rot47.net"
    }

    def __init__(self):
        pass

    def evaluate(self, parsed_email, auth_results, domain_intel, origin_geo):
        """Computes comprehensive threat scores and categorizes attack indicators."""
        subject = parsed_email.get("subject", "")
        body_text = parsed_email.get("body_text", "")
        full_text = f"{subject}\n{body_text}".lower()

        # 1. NLP & Linguistic Analysis
        urgency_score, urgency_hits = self._scan_patterns(full_text, self.URGENCY_PATTERNS)
        bec_score, bec_hits = self._scan_patterns(full_text, self.BEC_PATTERNS)
        credential_score, cred_hits = self._scan_patterns(full_text, self.CREDENTIAL_PATTERNS)

        # 2. URL Threat Analysis
        url_threat_score, url_alerts = self._analyze_urls(parsed_email.get("urls", []), parsed_email.get("from", {}).get("domain", ""))

        # 3. Attachment Threat Triage
        attachment_score, attachment_alerts = self._analyze_attachments(parsed_email.get("attachments", []))

        # 4. Header & Spoofing Score (from Auth Validator & Domain Intel)
        header_spoofing_score = 0
        if auth_results.get("spoofing_risk") == "CRITICAL":
            header_spoofing_score += 40
        elif auth_results.get("spoofing_risk") == "HIGH":
            header_spoofing_score += 25
        elif auth_results.get("spoofing_risk") == "MEDIUM":
            header_spoofing_score += 15

        if domain_intel.get("is_spoofed"):
            header_spoofing_score += 35
        if not auth_results.get("alignment", {}).get("reply_to_match", True):
            header_spoofing_score += 25

        header_spoofing_score = min(100, header_spoofing_score)

        # 5. Infrastructure Risk Score
        infra_risk_score = 0
        if origin_geo.get("is_bulletproof") or origin_geo.get("is_vpn_or_tor"):
            infra_risk_score += 40
        if origin_geo.get("is_cloud_provider"):
            infra_risk_score += 20
        if origin_geo.get("threat_risk") == "CRITICAL":
            infra_risk_score += 40
        elif origin_geo.get("threat_risk") == "HIGH":
            infra_risk_score += 25
        infra_risk_score = min(100, infra_risk_score)

        # Weighted Composite Threat Score
        composite_score = (
            (header_spoofing_score * 0.30) +
            (bec_score * 0.25) +
            (credential_score * 0.20) +
            (url_threat_score * 0.15) +
            (attachment_score * 0.10)
        )

        # Critical attack vector floor boosts
        if attachment_score >= 40:
            # Dangerous executable or macro payload demands elevated critical priority
            composite_score = max(composite_score, 78.0)

        if bec_score >= 35 and (header_spoofing_score >= 30 or urgency_score >= 20):
            composite_score = max(composite_score, 82.0)

        # If bulletproof infra and high spoofing, amplify
        if infra_risk_score >= 50 and header_spoofing_score >= 50:
            composite_score = max(composite_score, 88.0)

        composite_score = round(min(100.0, max(0.0, composite_score)), 1)

        # Determine Classification
        classification, primary_attack_type = self._determine_classification(
            composite_score, bec_score, credential_score, header_spoofing_score, attachment_score
        )

        # Specific BEC Indicator Flag
        is_bec = (bec_score >= 35 and (header_spoofing_score >= 30 or urgency_score >= 20))

        return {
            "threat_score": composite_score,
            "classification": classification,
            "primary_attack_vector": primary_attack_type,
            "is_bec": is_bec,
            "subscores": {
                "header_spoofing": header_spoofing_score,
                "urgency_nlp": min(100, urgency_score),
                "bec_financial": min(100, bec_score),
                "credential_harvesting": min(100, credential_score),
                "url_risk": min(100, url_threat_score),
                "attachment_risk": min(100, attachment_score),
                "infrastructure_risk": infra_risk_score
            },
            "findings": {
                "urgency_signals": urgency_hits,
                "bec_signals": bec_hits,
                "credential_signals": cred_hits,
                "url_alerts": url_alerts,
                "attachment_alerts": attachment_alerts
            }
        }

    def _scan_patterns(self, text, pattern_list):
        total_score = 0
        hits = []
        for pattern, weight, label in pattern_list:
            matches = list(set(re.findall(pattern, text, re.IGNORECASE)))
            if matches:
                total_score += weight * min(len(matches), 3)
                hits.append({
                    "label": label,
                    "matches": matches[:3],
                    "weight": weight
                })
        return total_score, hits

    def _analyze_urls(self, urls, sender_domain):
        alerts = []
        score = 0

        for item in urls:
            u = item.get("url", "")
            host = item.get("hostname", "")
            anchor = item.get("anchor_text", "")
            is_ip = item.get("is_ip", False)

            # Check IP as host
            if is_ip:
                alerts.append({
                    "url": u,
                    "type": "IP_HOST_URL",
                    "severity": "HIGH",
                    "description": f"URL points directly to raw IP address instead of domain: {host}"
                })
                score += 35

            # Check URL shorteners
            if host in self.URL_SHORTENERS:
                alerts.append({
                    "url": u,
                    "type": "OBFUSCATED_URL_SHORTENER",
                    "severity": "MEDIUM",
                    "description": f"URL shortener detected: {host} (used to conceal true destination)"
                })
                score += 25

            # Deceptive anchor text (Anchor says bank.com, href goes to attacker.com)
            parsed_anchor_host = ""
            if "http://" in anchor or "https://" in anchor or ".com" in anchor:
                parsed_anchor = urlparse(anchor if anchor.startswith("http") else "http://" + anchor)
                parsed_anchor_host = parsed_anchor.hostname or ""

            if parsed_anchor_host and host and parsed_anchor_host != host:
                alerts.append({
                    "url": u,
                    "type": "MISMATCHED_ANCHOR_DESTINATION",
                    "severity": "CRITICAL",
                    "description": f"Deceptive Link: Anchor text shows '{parsed_anchor_host}' but target destination is '{host}'"
                })
                score += 45

            # Suspicious keywords in URL path
            path = item.get("path", "").lower()
            if any(k in path for k in ["/wp-content", "/wp-admin", "/login", "/signin", "/verify", "/update", "/session"]):
                score += 15

        return min(100, score), alerts

    def _analyze_attachments(self, attachments):
        alerts = []
        score = 0

        for att in attachments:
            fname = att.get("filename", "").lower()

            # Check double extensions (e.g. invoice.pdf.exe)
            if re.search(r'\.[a-z0-9]{2,4}\.(exe|bat|scr|vbs|js|cmd)$', fname):
                alerts.append({
                    "filename": fname,
                    "type": "DOUBLE_EXTENSION_TRICK",
                    "severity": "CRITICAL",
                    "description": f"Dangerous double-extension disguised file: '{fname}'"
                })
                score += 50

            # Check dangerous extensions
            for ext in self.DANGEROUS_EXTENSIONS:
                if fname.endswith(ext):
                    alerts.append({
                        "filename": fname,
                        "type": "EXECUTABLE_PAYLOAD",
                        "severity": "CRITICAL",
                        "description": f"High-risk executable attachment detected: '{fname}' ({ext})"
                    })
                    score += 50
                    break

            # Check macro files
            for m_ext in self.MACRO_EXTENSIONS:
                if fname.endswith(m_ext):
                    alerts.append({
                        "filename": fname,
                        "type": "MACRO_ENABLED_DOCUMENT",
                        "severity": "HIGH",
                        "description": f"Macro-enabled document attachment: '{fname}' ({m_ext}) commonly used for dropper malware"
                    })
                    score += 40
                    break

        return min(100, score), alerts

    def _determine_classification(self, composite_score, bec_score, cred_score, header_score, attach_score):
        # Priority 1: Weaponized Attachment
        if attach_score >= 40:
            return "MALWARE_DELIVERY", "Malicious Attachment Weaponization"

        # Priority 2: BEC Financial Fraud
        if composite_score >= 75 and bec_score >= 35:
            return "CRITICAL_BEC_FRAUD", "Business Email Compromise (Financial Diversion)"

        # Priority 3: Phishing / Credential Harvesting
        if composite_score >= 70:
            if cred_score >= 25:
                return "PHISHING", "Credential Harvesting Attack"
            return "PHISHING", "Advanced Spear Phishing"

        # Priority 4: Impersonation / Suspicious
        if composite_score >= 50:
            if header_score >= 40:
                return "IMPERSONATED", "Display Name / Sender Domain Impersonation"
            return "SUSPICIOUS", "Suspicious Communication"

        if composite_score >= 25:
            return "SUSPICIOUS", "Low-Confidence Anomaly"

        return "LEGITIMATE", "Verified Authentic Communication"
