"""
Email Forensic Parser
Extracts RFC 5322 MIME structures, standard/extended headers, body content,
hyperlinks, attachments, and cryptographic evidence hashes.
"""

import email
from email import policy
from email.parser import BytesParser, Parser
import hashlib
import re
from urllib.parse import urlparse
from html.parser import HTMLParser


class LinkExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self._current_href = None
        self._current_text = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            for attr, val in attrs:
                if attr.lower() == "href" and val:
                    self._current_href = val.strip()
                    self._current_text = []

    def handle_data(self, data):
        if self._current_href is not None:
            self._current_text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._current_href is not None:
            anchor_text = " ".join("".join(self._current_text).split()).strip()
            self.links.append({
                "url": self._current_href,
                "anchor_text": anchor_text or self._current_href
            })
            self._current_href = None
            self._current_text = []


class EmailForensicParser:
    """Parses raw email text or bytes into structured forensic artifacts."""

    URL_REGEX = re.compile(
        r'https?://(?:[a-zA-Z0-9$-_@.&+!*"(),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+',
        re.IGNORECASE
    )

    def __init__(self, raw_input):
        if isinstance(raw_input, bytes):
            self.raw_bytes = raw_input
            self.raw_text = raw_input.decode('utf-8', errors='replace')
        else:
            self.raw_text = str(raw_input)
            self.raw_bytes = self.raw_text.encode('utf-8')

    def compute_hashes(self):
        """Computes SHA-256, SHA-1, and MD5 of the raw email content for chain of custody."""
        return {
            "sha256": hashlib.sha256(self.raw_bytes).hexdigest(),
            "sha1": hashlib.sha1(self.raw_bytes).hexdigest(),
            "md5": hashlib.md5(self.raw_bytes).hexdigest(),
            "size_bytes": len(self.raw_bytes)
        }

    def parse(self):
        """Executes deep forensic parsing and returns structured metadata."""
        # Try standard policy first
        try:
            msg = BytesParser(policy=policy.default).parsebytes(self.raw_bytes)
        except Exception:
            msg = email.message_from_string(self.raw_text)

        hashes = self.compute_hashes()

        # Extract standard & extended headers
        headers_dict = {}
        received_headers = []
        raw_headers_list = []

        for key, val in msg.items():
            str_val = str(val).strip()
            raw_headers_list.append({"name": key, "value": str_val})
            if key.lower() == "received":
                received_headers.append(str_val)
            else:
                if key.lower() not in headers_dict:
                    headers_dict[key.lower()] = str_val

        # Core header extraction
        subject = msg.get("Subject", "(No Subject)")
        from_header = msg.get("From", "")
        to_header = msg.get("To", "")
        cc_header = msg.get("Cc", "")
        date_header = msg.get("Date", "")
        message_id = msg.get("Message-ID", "")
        reply_to = msg.get("Reply-To", "")
        return_path = msg.get("Return-Path", "")
        auth_results = msg.get("Authentication-Results", "")
        received_spf = msg.get("Received-SPF", "")
        dkim_sig = msg.get("DKIM-Signature", "")
        x_originating_ip = msg.get("X-Originating-IP", "")
        x_mailer = msg.get("X-Mailer", msg.get("User-Agent", ""))

        # Clean addresses
        from_display, from_email = self._extract_display_and_email(from_header)
        reply_to_display, reply_to_email = self._extract_display_and_email(reply_to)
        return_path_email = self._extract_clean_email(return_path)

        # Parse body and attachments
        body_text, body_html, attachments = self._extract_content(msg)

        # Extract URLs
        extracted_urls = self._extract_urls(body_text, body_html)

        return {
            "hashes": hashes,
            "subject": str(subject),
            "date": str(date_header),
            "message_id": str(message_id).strip('<>'),
            "from": {
                "raw": str(from_header),
                "display_name": from_display,
                "email": from_email,
                "domain": from_email.split('@')[-1].lower() if '@' in from_email else ""
            },
            "to": str(to_header),
            "cc": str(cc_header),
            "reply_to": {
                "raw": str(reply_to),
                "display_name": reply_to_display,
                "email": reply_to_email,
                "domain": reply_to_email.split('@')[-1].lower() if '@' in reply_to_email else ""
            },
            "return_path": {
                "raw": str(return_path),
                "email": return_path_email,
                "domain": return_path_email.split('@')[-1].lower() if '@' in return_path_email else ""
            },
            "auth_results": str(auth_results),
            "received_spf": str(received_spf),
            "dkim_signature": str(dkim_sig),
            "x_originating_ip": str(x_originating_ip).strip('[] '),
            "x_mailer": str(x_mailer),
            "received_headers": received_headers,
            "raw_headers_list": raw_headers_list,
            "body_text": body_text,
            "body_html": body_html,
            "attachments": attachments,
            "urls": extracted_urls,
            "raw_text": self.raw_text
        }

    def _extract_display_and_email(self, header_val):
        if not header_val:
            return "", ""
        val = str(header_val)
        # Check Name <email@domain.com>
        match = re.match(r'^(.*?)\s*<([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)>', val)
        if match:
            display = match.group(1).strip('"\'; ')
            addr = match.group(2).strip().lower()
            return display, addr
        # Just email
        match_simple = re.search(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', val)
        if match_simple:
            addr = match_simple.group(1).strip().lower()
            return "", addr
        return val.strip('"\'; '), ""

    def _extract_clean_email(self, header_val):
        if not header_val:
            return ""
        match = re.search(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', str(header_val))
        return match.group(1).strip().lower() if match else ""

    def _extract_content(self, msg):
        body_text_parts = []
        body_html_parts = []
        attachments = []

        if msg.is_multipart():
            for part in msg.walk():
                content_disposition = part.get_content_disposition()
                content_type = part.get_content_type()

                if content_disposition == "attachment" or part.get_filename():
                    filename = part.get_filename() or "unnamed_attachment"
                    payload = part.get_payload(decode=True) or b""
                    attachments.append({
                        "filename": filename,
                        "content_type": content_type,
                        "size_bytes": len(payload),
                        "sha256": hashlib.sha256(payload).hexdigest()
                    })
                elif content_type == "text/plain":
                    try:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body_text_parts.append(payload.decode('utf-8', errors='replace'))
                    except Exception:
                        pass
                elif content_type == "text/html":
                    try:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body_html_parts.append(payload.decode('utf-8', errors='replace'))
                    except Exception:
                        pass
        else:
            content_type = msg.get_content_type()
            try:
                payload = msg.get_payload(decode=True)
                if payload:
                    decoded = payload.decode('utf-8', errors='replace')
                    if content_type == "text/html":
                        body_html_parts.append(decoded)
                    else:
                        body_text_parts.append(decoded)
                else:
                    raw_p = msg.get_payload()
                    if isinstance(raw_p, str):
                        body_text_parts.append(raw_p)
            except Exception:
                pass

        body_text = "\n".join(body_text_parts).strip()
        body_html = "\n".join(body_html_parts).strip()

        # If body_text is empty but raw_text has content (e.g. single message without MIME boundary)
        if not body_text and not body_html:
            # Check if there is body separated by double newline
            parts = re.split(r'\r?\n\r?\n', self.raw_text, maxsplit=1)
            if len(parts) > 1:
                body_text = parts[1].strip()

        return body_text, body_html, attachments

    def _extract_urls(self, text, html):
        found = {}

        # Parse HTML hrefs
        if html:
            try:
                parser = LinkExtractor()
                parser.feed(html)
                for item in parser.links:
                    u = item["url"]
                    if u not in found:
                        found[u] = item["anchor_text"]
            except Exception:
                pass

        # Regex fallback on plain text
        for url in self.URL_REGEX.findall(text):
            cleaned = url.rstrip('.,);>"\']')
            if cleaned not in found:
                found[cleaned] = cleaned

        # Detailed breakdown
        results = []
        for url, anchor in found.items():
            try:
                parsed = urlparse(url)
                hostname = parsed.hostname or ""
                results.append({
                    "url": url,
                    "anchor_text": anchor,
                    "hostname": hostname.lower(),
                    "scheme": parsed.scheme,
                    "path": parsed.path,
                    "is_ip": bool(re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', hostname))
                })
            except Exception:
                results.append({
                    "url": url,
                    "anchor_text": anchor,
                    "hostname": "",
                    "scheme": "",
                    "path": "",
                    "is_ip": False
                })

        return results
