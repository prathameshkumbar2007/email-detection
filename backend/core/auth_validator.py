"""
Email Protocol Authentication and Alignment Validator
Evaluates SPF, DKIM, and DMARC verification headers, checks domain alignment
(Strict / Relaxed), flags Return-Path / From / Reply-To discrepancies, and calculates
spoofing risk.
"""

import re
import dns.resolver


class AuthProtocolValidator:
    """Validates SPF, DKIM, DMARC, and header sender alignment."""

    def __init__(self, parsed_email):
        self.parsed = parsed_email
        self.from_domain = parsed_email.get("from", {}).get("domain", "").lower()
        self.from_email = parsed_email.get("from", {}).get("email", "").lower()
        self.return_path_email = parsed_email.get("return_path", {}).get("email", "").lower()
        self.return_path_domain = parsed_email.get("return_path", {}).get("domain", "").lower()
        self.reply_to_email = parsed_email.get("reply_to", {}).get("email", "").lower()
        self.reply_to_domain = parsed_email.get("reply_to", {}).get("domain", "").lower()

        self.auth_results = parsed_email.get("auth_results", "")
        self.received_spf = parsed_email.get("received_spf", "")
        self.dkim_sig = parsed_email.get("dkim_signature", "")

    def validate(self):
        """Runs protocol inspection and alignment checks."""
        spf_result = self._evaluate_spf()
        dkim_result = self._evaluate_dkim()
        dmarc_result = self._evaluate_dmarc(spf_result, dkim_result)
        alignment_result = self._evaluate_alignment(dkim_result)

        # Calculate Protocol Security Score (0 = completely forged, 100 = fully verified)
        score = 0
        reasons = []

        if spf_result["status"] == "PASS":
            score += 30
        elif spf_result["status"] in ("FAIL", "SOFTFAIL"):
            reasons.append(f"SPF Check {spf_result['status']}: Sender IP unauthorized to transmit mail for {self.from_domain}")

        if dkim_result["status"] == "PASS":
            score += 35
            if dkim_result["aligned"]:
                score += 15
            else:
                reasons.append(f"DKIM signature domain ({dkim_result.get('signing_domain')}) does not align with From domain ({self.from_domain})")
        elif dkim_result["status"] == "FAIL":
            reasons.append("DKIM cryptographic signature verification failed (body or headers tampered)")
        elif dkim_result["status"] == "NONE":
            reasons.append("Email lacks DKIM cryptographic authentication signature")

        if dmarc_result["status"] == "PASS":
            score += 20
        elif dmarc_result["status"] == "FAIL":
            reasons.append(f"DMARC policy check failed for domain {self.from_domain}")

        # Check sender alignment discrepancies
        if not alignment_result["return_path_match"] and self.return_path_domain:
            reasons.append(f"Envelope Return-Path ({self.return_path_domain}) does not match From Header ({self.from_domain})")

        if not alignment_result["reply_to_match"] and self.reply_to_email:
            reasons.append(f"Suspicious Reply-To redirect: Replies sent to {self.reply_to_email} instead of sender {self.from_email}")

        # Spoofing risk level
        if score >= 80 and alignment_result["reply_to_match"]:
            spoofing_risk = "LOW"
        elif score >= 50:
            spoofing_risk = "MEDIUM"
        elif score >= 20:
            spoofing_risk = "HIGH"
        else:
            spoofing_risk = "CRITICAL"

        if not alignment_result["reply_to_match"] and self.reply_to_email:
            spoofing_risk = "CRITICAL"

        return {
            "score": min(100, max(0, score)),
            "spoofing_risk": spoofing_risk,
            "spf": spf_result,
            "dkim": dkim_result,
            "dmarc": dmarc_result,
            "alignment": alignment_result,
            "discrepancies": reasons
        }

    def _evaluate_spf(self):
        """Parses SPF status from Received-SPF or Authentication-Results."""
        status = "NONE"
        details = ""

        # Check Received-SPF
        if self.received_spf:
            rec_lower = self.received_spf.lower()
            if rec_lower.startswith("pass") or "pass" in rec_lower:
                status = "PASS"
            elif rec_lower.startswith("fail") or "fail" in rec_lower:
                status = "FAIL"
            elif "softfail" in rec_lower:
                status = "SOFTFAIL"
            elif "neutral" in rec_lower:
                status = "NEUTRAL"
            details = self.received_spf
        elif self.auth_results:
            match = re.search(r'spf=(\w+)', self.auth_results, re.IGNORECASE)
            if match:
                s = match.group(1).upper()
                if s in ("PASS", "FAIL", "SOFTFAIL", "NEUTRAL", "NONE"):
                    status = s
                details = f"Extracted from Authentication-Results: spf={status}"

        # If still none, check DNS TXT SPF record for the domain
        dns_spf_record = self._query_dns_spf(self.from_domain)

        return {
            "status": status,
            "domain": self.from_domain,
            "dns_record": dns_spf_record,
            "details": details or "No SPF verification header present"
        }

    def _evaluate_dkim(self):
        """Parses DKIM verification and domain alignment."""
        status = "NONE"
        signing_domain = ""
        selector = ""
        aligned = False
        details = ""

        # Check DKIM-Signature header
        if self.dkim_sig:
            d_match = re.search(r'd=([a-zA-Z0-9.-]+)', self.dkim_sig)
            if d_match:
                signing_domain = d_match.group(1).lower()
            s_match = re.search(r's=([a-zA-Z0-9.-]+)', self.dkim_sig)
            if s_match:
                selector = s_match.group(1)

        # Check Authentication-Results
        if self.auth_results:
            match = re.search(r'dkim=(\w+)', self.auth_results, re.IGNORECASE)
            if match:
                s = match.group(1).upper()
                if s in ("PASS", "FAIL", "NEUTRAL", "NONE"):
                    status = s
                details = f"Authentication-Results: dkim={status}"
        elif self.dkim_sig:
            status = "PASS"
            details = "DKIM-Signature header present"

        if signing_domain:
            # Check alignment with From domain
            if signing_domain == self.from_domain or self.from_domain.endswith("." + signing_domain):
                aligned = True

        return {
            "status": status,
            "signing_domain": signing_domain,
            "selector": selector,
            "aligned": aligned,
            "details": details or "No DKIM signature found"
        }

    def _evaluate_dmarc(self, spf_result, dkim_result):
        """Evaluates DMARC policy from headers or DNS."""
        status = "NONE"
        policy = "none"
        details = ""

        if self.auth_results:
            match = re.search(r'dmarc=(\w+)', self.auth_results, re.IGNORECASE)
            if match:
                status = match.group(1).upper()
                details = f"Authentication-Results: dmarc={status}"

        # If not explicitly declared, infer from SPF and DKIM
        if status == "NONE":
            if (spf_result["status"] == "PASS" and self.return_path_domain == self.from_domain) or \
               (dkim_result["status"] == "PASS" and dkim_result["aligned"]):
                status = "PASS"
                details = "Inferred DMARC pass via aligned SPF or DKIM"
            elif spf_result["status"] in ("FAIL", "SOFTFAIL") or (dkim_result["status"] in ("FAIL", "NONE")):
                status = "FAIL"
                details = "SPF and DKIM unaligned or failed"

        # Check live DNS DMARC record if possible
        dmarc_record = self._query_dns_dmarc(self.from_domain)
        if dmarc_record:
            p_match = re.search(r'p=(\w+)', dmarc_record, re.IGNORECASE)
            if p_match:
                policy = p_match.group(1).lower()

        return {
            "status": status,
            "domain": self.from_domain,
            "policy": policy,
            "dns_record": dmarc_record,
            "details": details or "DMARC status could not be validated"
        }

    def _evaluate_alignment(self, dkim_result):
        """Checks alignment between From, Return-Path, and Reply-To."""
        return_path_match = True
        if self.return_path_domain and self.from_domain:
            return_path_match = (
                self.return_path_domain == self.from_domain or
                self.from_domain.endswith("." + self.return_path_domain) or
                self.return_path_domain.endswith("." + self.from_domain)
            )

        reply_to_match = True
        if self.reply_to_email and self.from_email:
            reply_to_match = (self.reply_to_email == self.from_email)

        return {
            "return_path_match": return_path_match,
            "reply_to_match": reply_to_match,
            "dkim_aligned": dkim_result.get("aligned", False),
            "from_domain": self.from_domain,
            "return_path_domain": self.return_path_domain,
            "reply_to_email": self.reply_to_email
        }

    def _query_dns_spf(self, domain):
        if not domain:
            return ""
        try:
            answers = dns.resolver.resolve(domain, 'TXT', lifetime=1.5)
            for rdata in answers:
                txt = rdata.to_text().strip('"')
                if "v=spf1" in txt:
                    return txt
        except Exception:
            pass
        return ""

    def _query_dns_dmarc(self, domain):
        if not domain:
            return ""
        try:
            dmarc_host = f"_dmarc.{domain}"
            answers = dns.resolver.resolve(dmarc_host, 'TXT', lifetime=1.5)
            for rdata in answers:
                txt = rdata.to_text().strip('"')
                if "v=DMARC1" in txt:
                    return txt
        except Exception:
            pass
        return ""
