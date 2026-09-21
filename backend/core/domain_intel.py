"""
Domain Intelligence and Typosquatting Analysis Module
Detects homoglyphs, Punycode IDN deception, Levenshtein typosquatting,
combosquatting, high-risk TLDs, and display name spoofing.
"""

import re
import unicodedata


class DomainIntelligenceEngine:
    """Analyzes sender domains and display names for deceptive spoofing techniques."""

    PROTECTED_BRANDS = [
        "microsoft", "office365", "paypal", "apple", "google", "amazon",
        "chase", "bankofamerica", "wellsfargo", "citibank", "dhl", "fedex",
        "netflix", "irs", "dropbox", "facebook", "linkedin", "irs"
    ]

    HIGH_RISK_TLDS = {
        "xyz", "top", "tk", "ml", "ga", "cf", "gq", "work", "click",
        "buzz", "space", "monster", "quest", "surf", "rest", "cam", "icu"
    }

    FREE_WEBMAIL_DOMAINS = {
        "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
        "proton.me", "protonmail.com", "mail.com", "yandex.com", "zoho.com"
    }

    HOMOGLYPH_MAP = {
        '\u0430': 'a',  # Cyrillic small a
        '\u0441': 'c',  # Cyrillic small es
        '\u0435': 'e',  # Cyrillic small ie
        '\u043e': 'o',  # Cyrillic small o
        '\u0440': 'p',  # Cyrillic small er
        '\u0455': 's',  # Cyrillic small dze
        '\u0443': 'y',  # Cyrillic small u
        '\u0456': 'i',  # Cyrillic small byelorussian-ukrainian i
        '\u0458': 'j',  # Cyrillic small je
        '\u03b1': 'a',  # Greek small alpha
        '\u03bf': 'o',  # Greek small omicron
        '0': 'o',
        '1': 'l',
        '3': 'e',
        '5': 's',
        'vv': 'w',
    }

    def __init__(self):
        pass

    def analyze(self, from_display, from_email, reply_to_email=""):
        """Evaluates domain and display name risks."""
        from_domain = from_email.split('@')[-1].lower() if '@' in from_email else ""
        alerts = []
        is_spoofed = False
        target_brand = None

        # 1. Punycode (IDN) check
        is_punycode = "xn--" in from_domain
        decoded_punycode = ""
        if is_punycode:
            try:
                decoded_punycode = from_domain.encode('ascii').decode('idna')
                alerts.append({
                    "type": "PUNYCODE_IDN_SPOOFING",
                    "severity": "CRITICAL",
                    "description": f"Internationalized Domain (Punycode) detected: {from_domain} decodes to visual homoglyph '{decoded_punycode}'"
                })
                is_spoofed = True
            except Exception:
                pass

        # 2. Homoglyph substitution scan
        homoglyph_detected, normalized_domain = self._detect_homoglyphs(decoded_punycode or from_domain)
        if homoglyph_detected:
            alerts.append({
                "type": "HOMOGLYPH_ATTACK",
                "severity": "CRITICAL",
                "description": f"Non-ASCII / Cyrillic homoglyph characters detected inside domain. Normalizes to: '{normalized_domain}'"
            })
            is_spoofed = True

        # 3. Typosquatting / Levenshtein check against protected brands
        # Check whole domain first, then individual tokens (e.g. micros0ft from micros0ft-login)
        domain_tokens = re.split(r'[-_.]', normalized_domain or from_domain)
        for token in domain_tokens:
            if not token:
                continue
            # Also normalize leet numbers (0 -> o, 1 -> l, 3 -> e, 5 -> s)
            token_norm = token.replace('0', 'o').replace('1', 'l').replace('3', 'e').replace('5', 's')
            brand_match = self._check_brand_similarity(token_norm)
            if brand_match:
                target_brand = brand_match["brand"]
                if brand_match["similarity"] < 1.0 or token != token_norm:
                    alerts.append({
                        "type": "TYPOSQUATTING_DETECTED",
                        "severity": "HIGH",
                        "description": f"Domain token '{token}' in '{from_domain}' is a deceptive lookalike of protected brand '{brand_match['brand']}' (distance: {brand_match['distance']}, similarity: {brand_match['similarity']:.2f})"
                    })
                    is_spoofed = True
                break

        # 4. Combosquatting check (e.g. microsoft-login-secure.com)
        combosquat = self._check_combosquatting(from_domain)
        if combosquat:
            alerts.append({
                "type": "COMBOSQUATTING_DETECTED",
                "severity": "HIGH",
                "description": f"Domain embeds brand keyword '{combosquat['brand']}' alongside deceptive security terms: {combosquat['terms']}"
            })
            is_spoofed = True

        # 5. High-Risk TLD check
        tld = from_domain.split('.')[-1] if '.' in from_domain else ""
        if tld in self.HIGH_RISK_TLDS:
            alerts.append({
                "type": "HIGH_RISK_TLD",
                "severity": "MEDIUM",
                "description": f"Sender domain uses top-level domain '.{tld}', which has an elevated statistical correlation with phishing campaigns."
            })

        # 6. Display Name Impersonation
        display_alerts = self._check_display_name(from_display, from_domain, from_email)
        alerts.extend(display_alerts)
        if display_alerts:
            is_spoofed = True

        # 7. Free Webmail Domain Impersonation
        if from_domain in self.FREE_WEBMAIL_DOMAINS:
            # If display name mentions corporate/executive title
            exec_cues = ["ceo", "cfo", "director", "finance", "hr", "payroll", "admin", "it support", "president"]
            if any(cue in from_display.lower() for cue in exec_cues):
                alerts.append({
                    "type": "FREE_WEBMAIL_EXECUTIVE_IMPERSONATION",
                    "severity": "CRITICAL",
                    "description": f"Executive title in display name ('{from_display}') sending from free consumer webmail provider ({from_domain}). Strong indicator of BEC."
                })
                is_spoofed = True

        return {
            "domain": from_domain,
            "target_brand": target_brand,
            "is_spoofed": is_spoofed,
            "is_punycode": is_punycode,
            "decoded_punycode": decoded_punycode,
            "tld": tld,
            "is_high_risk_tld": tld in self.HIGH_RISK_TLDS,
            "is_free_webmail": from_domain in self.FREE_WEBMAIL_DOMAINS,
            "alerts": alerts
        }

    def _detect_homoglyphs(self, text):
        found = False
        chars = []
        for char in text:
            if char in self.HOMOGLYPH_MAP:
                found = True
                chars.append(self.HOMOGLYPH_MAP[char])
            elif ord(char) > 127:
                found = True
                # Normalize unicode
                decomp = unicodedata.normalize('NFKD', char)
                chars.append(decomp[0] if decomp else char)
            else:
                chars.append(char)
        return found, "".join(chars)

    def _check_brand_similarity(self, test_name):
        best = None
        for brand in self.PROTECTED_BRANDS:
            dist = self._levenshtein(test_name, brand)
            max_len = max(len(test_name), len(brand))
            sim = 1.0 - (dist / max_len) if max_len > 0 else 0
            if dist <= 2 and sim >= 0.70:
                if dist == 0:
                    return {"brand": brand, "distance": 0, "similarity": 1.0}
                if not best or sim > best["similarity"]:
                    best = {"brand": brand, "distance": dist, "similarity": sim}
        return best

    def _check_combosquatting(self, domain):
        deceptive_keywords = ["login", "verify", "secure", "update", "account", "support", "billing", "portal", "auth", "helpdesk"]
        found_terms = []
        matched_brand = None

        for brand in self.PROTECTED_BRANDS:
            if brand in domain and domain != f"{brand}.com" and not domain.endswith(f".{brand}.com"):
                matched_brand = brand
                for term in deceptive_keywords:
                    if term in domain:
                        found_terms.append(term)
                if found_terms:
                    return {"brand": matched_brand, "terms": found_terms}
        return None

    def _check_display_name(self, display_name, sender_domain, sender_email):
        alerts = []
        if not display_name:
            return alerts

        disp_lower = display_name.lower()

        # Check if display name contains another email address
        nested_email_match = re.search(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', display_name)
        if nested_email_match:
            nested = nested_email_match.group(1).lower()
            if nested != sender_email.lower():
                alerts.append({
                    "type": "DISPLAY_NAME_EMAIL_INJECTION",
                    "severity": "CRITICAL",
                    "description": f"Display Name embeds spoofed email address '{nested}' to deceive end-users, while actual envelope email is '{sender_email}'"
                })

        # Check if display name claims to be a brand
        for brand in self.PROTECTED_BRANDS:
            if brand in disp_lower and brand not in sender_domain:
                alerts.append({
                    "type": "BRAND_DISPLAY_NAME_SPOOFING",
                    "severity": "HIGH",
                    "description": f"Display Name claims authority '{display_name}' but sending domain '{sender_domain}' is unaffiliated with {brand}."
                })
                break

        return alerts

    def _levenshtein(self, s1, s2):
        if len(s1) < len(s2):
            return self._levenshtein(s2, s1)
        if len(s2) == 0:
            return len(s1)
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        return previous_row[-1]
