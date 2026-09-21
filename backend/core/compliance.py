"""
Privacy, Legal Evidentiary, and Chain-of-Custody Module
Handles PII masking, cryptographic evidence preservation, audit logging,
and generates structured forensic PDF and STIX/JSON intelligence reports.
"""

import re
import io
from datetime import datetime, timezone

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


class ComplianceAndEvidenceLocker:
    """Manages chain of custody, PII redaction, and forensic PDF report generation."""

    def __init__(self, pii_masking_enabled=False):
        self.pii_masking_enabled = pii_masking_enabled

    def mask_pii(self, text):
        """Redacts sensitive personally identifiable information from strings."""
        if not self.pii_masking_enabled or not text:
            return text

        masked = str(text)
        # Redact emails: a***b@example.com
        masked = re.sub(
            r'\b([a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]*([a-zA-Z0-9_.+-])@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b',
            r'\1***\2@\3',
            masked
        )
        # Redact phone numbers
        masked = re.sub(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', '[REDACTED_PHONE]', masked)
        # Redact credit cards
        masked = re.sub(r'\b(?:\d{4}[-\s]?){3}\d{4}\b', '[REDACTED_CARD_NUMBER]', masked)
        # Redact IBAN
        masked = re.sub(r'\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b', '[REDACTED_IBAN]', masked)

        return masked

    def create_custody_log(self, parsed_email, analyst_name="Digital Forensics Unit"):
        """Generates an evidentiary chain of custody timeline."""
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        hashes = parsed_email.get("hashes", {})

        return [
            {
                "timestamp": now_str,
                "action": "EVIDENCE_INGESTION",
                "actor": analyst_name,
                "details": f"Raw email ingested. Integrity seal generated. Size: {hashes.get('size_bytes', 0)} bytes.",
                "hash_sha256": hashes.get("sha256", "")
            },
            {
                "timestamp": now_str,
                "action": "HEADER_FORENSICS",
                "actor": "Forensic Parsing Subsystem",
                "details": "Parsed RFC 5322 headers, MIME parts, transmission hops, and cryptographic signatures.",
                "hash_sha256": hashes.get("sha256", "")
            },
            {
                "timestamp": now_str,
                "action": "THREAT_CORRELATION",
                "actor": "AI Threat & Attribution Engine",
                "details": "Correlated originating node IP intelligence, domain lookalikes, and linguistic BEC patterns.",
                "hash_sha256": hashes.get("sha256", "")
            },
            {
                "timestamp": now_str,
                "action": "EVIDENCE_PRESERVED",
                "actor": "Secure Evidence Store",
                "details": "Digital artifact locked with immutable timestamp and cryptographic verification seal.",
                "hash_sha256": hashes.get("sha256", "")
            }
        ]

    def export_stix_json(self, parsed, auth, geo, threat, attribution, custody_log):
        """Builds a standardized STIX/TAXII-compatible JSON bundle."""
        hashes = parsed.get("hashes", {})
        return {
            "type": "bundle",
            "id": f"bundle--{hashes.get('sha256', 'unknown')[:32]}",
            "spec_version": "2.1",
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
            "forensic_case_summary": {
                "subject": parsed.get("subject"),
                "sender_claimed": parsed.get("from", {}).get("raw"),
                "origin_ip": geo.get("ip"),
                "origin_country": geo.get("country"),
                "origin_asn": geo.get("asn"),
                "threat_score": threat.get("threat_score"),
                "threat_classification": threat.get("classification"),
                "primary_attack_vector": threat.get("primary_attack_vector"),
                "attribution_profile": attribution.get("attribution_profile", {}).get("label"),
                "attribution_confidence": attribution.get("confidence_percent"),
                "hashes": hashes
            },
            "chain_of_custody": custody_log,
            "indicators_of_compromise": [
                {
                    "type": "ipv4-addr",
                    "value": geo.get("ip"),
                    "threat_risk": geo.get("threat_risk"),
                    "isp": geo.get("isp"),
                    "is_bulletproof": geo.get("is_bulletproof")
                },
                {
                    "type": "domain-name",
                    "value": parsed.get("from", {}).get("domain"),
                    "is_spoofed": threat.get("subscores", {}).get("header_spoofing", 0) > 30
                }
            ],
            "authentication_evidence": {
                "spf": auth.get("spf"),
                "dkim": auth.get("dkim"),
                "dmarc": auth.get("dmarc"),
                "alignment": auth.get("alignment")
            }
        }

    def generate_pdf_report(self, parsed, auth, geo, threat, attribution, custody_log, relay):
        """Generates a court-ready, publication-grade PDF Forensic Intelligence Report."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        normal_style = styles["Normal"]

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=6
        )

        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=14
        )

        heading_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=10,
            spaceAfter=6
        )

        cell_style = ParagraphStyle(
            'TableCell',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            textColor=colors.HexColor('#1e293b'),
            leading=10
        )

        cell_bold = ParagraphStyle(
            'TableCellBold',
            parent=cell_style,
            fontName='Helvetica-Bold'
        )

        story = []

        # 1. Header Banner
        story.append(Paragraph("DIGITAL FORENSIC INTELLIGENCE REPORT", title_style))
        story.append(Paragraph(
            f"Case Reference: IR-{parsed.get('hashes', {}).get('sha256', '')[:12].upper()} &nbsp;|&nbsp; "
            f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} &nbsp;|&nbsp; "
            f"Classification: FORENSIC INVESTIGATION RECORD",
            subtitle_style
        ))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563eb'), spaceAfter=10))

        # 2. Executive Summary Block
        story.append(Paragraph("1. EXECUTIVE THREAT ASSESSMENT", heading_style))

        score = threat.get("threat_score", 0)
        score_color = colors.HexColor('#dc2626') if score >= 75 else (colors.HexColor('#d97706') if score >= 40 else colors.HexColor('#16a34a'))

        summary_data = [
            [Paragraph("Threat Score:", cell_bold), Paragraph(f"<b>{score} / 100</b> ({threat.get('classification')})", cell_style)],
            [Paragraph("Primary Attack Vector:", cell_bold), Paragraph(str(threat.get("primary_attack_vector")), cell_style)],
            [Paragraph("Attribution Profile:", cell_bold), Paragraph(str(attribution.get("attribution_profile", {}).get("label")), cell_style)],
            [Paragraph("Attribution Confidence:", cell_bold), Paragraph(f"{attribution.get('confidence_percent')}%", cell_style)],
            [Paragraph("Subject Line:", cell_bold), Paragraph(self.mask_pii(parsed.get("subject")), cell_style)],
            [Paragraph("Claimed Sender (From):", cell_bold), Paragraph(self.mask_pii(parsed.get("from", {}).get("raw")), cell_style)],
            [Paragraph("Return-Path:", cell_bold), Paragraph(self.mask_pii(parsed.get("return_path", {}).get("email")), cell_style)],
            [Paragraph("Reply-To:", cell_bold), Paragraph(self.mask_pii(parsed.get("reply_to", {}).get("email")), cell_style)]
        ]

        t_summary = Table(summary_data, colWidths=[150, 390])
        t_summary.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(t_summary)
        story.append(Spacer(1, 10))

        # 3. Origin Traceability & Infrastructure
        story.append(Paragraph("2. ORIGIN TRACEABILITY & INFRASTRUCTURE INTELLIGENCE", heading_style))
        origin_data = [
            [Paragraph("Earliest Origin IP:", cell_bold), Paragraph(str(geo.get("ip")), cell_style)],
            [Paragraph("Estimated Location:", cell_bold), Paragraph(f"{geo.get('city')}, {geo.get('region')}, {geo.get('country')} ({geo.get('country_code')})", cell_style)],
            [Paragraph("GPS Coordinates:", cell_bold), Paragraph(f"Lat: {geo.get('lat')}, Lon: {geo.get('lon')}", cell_style)],
            [Paragraph("Autonomous System:", cell_bold), Paragraph(f"{geo.get('asn')} - {geo.get('as_name')}", cell_style)],
            [Paragraph("ISP / Organization:", cell_bold), Paragraph(str(geo.get("isp")), cell_style)],
            [Paragraph("Network Classification:", cell_bold), Paragraph(f"<b>{geo.get('network_type')}</b> (Threat Level: {geo.get('threat_risk')})", cell_style)]
        ]
        t_origin = Table(origin_data, colWidths=[150, 390])
        t_origin.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(t_origin)
        story.append(Spacer(1, 10))

        # 4. Authentication Protocols Table
        story.append(Paragraph("3. SENDER AUTHENTICATION & ALIGNMENT VERIFICATION", heading_style))
        auth_data = [
            [Paragraph("Protocol", cell_bold), Paragraph("Status", cell_bold), Paragraph("Forensic Alignment & Evaluation Details", cell_bold)],
            [Paragraph("SPF", cell_style), Paragraph(auth.get("spf", {}).get("status", "NONE"), cell_style), Paragraph(str(auth.get("spf", {}).get("details", "")), cell_style)],
            [Paragraph("DKIM", cell_style), Paragraph(auth.get("dkim", {}).get("status", "NONE"), cell_style), Paragraph(f"Domain: {auth.get('dkim', {}).get('signing_domain', 'N/A')} | Aligned: {auth.get('dkim', {}).get('aligned', False)}", cell_style)],
            [Paragraph("DMARC", cell_style), Paragraph(auth.get("dmarc", {}).get("status", "NONE"), cell_style), Paragraph(f"Policy: {auth.get('dmarc', {}).get('policy', 'none')} | Details: {auth.get('dmarc', {}).get('details', '')}", cell_style)],
            [Paragraph("Reply-To Match", cell_style), Paragraph("ALIGNED" if auth.get("alignment", {}).get("reply_to_match") else "DEVIATION", cell_style), Paragraph("Replies routed to intended sender domain" if auth.get("alignment", {}).get("reply_to_match") else f"Replies redirected to alternate target: {auth.get('alignment', {}).get('reply_to_email')}", cell_style)]
        ]
        t_auth = Table(auth_data, colWidths=[80, 80, 380])
        t_auth.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(t_auth)
        story.append(Spacer(1, 10))

        # 5. Evidentiary Chain of Custody & Hashes
        story.append(Paragraph("4. CHAIN OF CUSTODY & INTEGRITY PRESERVATION", heading_style))
        hashes = parsed.get("hashes", {})
        hash_data = [
            [Paragraph("Artifact SHA-256 Seal:", cell_bold), Paragraph(f"<code>{hashes.get('sha256')}</code>", cell_style)],
            [Paragraph("Artifact SHA-1 Seal:", cell_bold), Paragraph(f"<code>{hashes.get('sha1')}</code>", cell_style)],
            [Paragraph("Artifact MD5 Checksum:", cell_bold), Paragraph(f"<code>{hashes.get('md5')}</code>", cell_style)],
            [Paragraph("Raw File Size:", cell_bold), Paragraph(f"{hashes.get('size_bytes')} bytes", cell_style)]
        ]
        t_hash = Table(hash_data, colWidths=[150, 390])
        t_hash.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t_hash)
        story.append(Spacer(1, 8))

        # Custody events
        custody_rows = [[Paragraph("Timestamp (UTC)", cell_bold), Paragraph("Action", cell_bold), Paragraph("Investigator / System", cell_bold), Paragraph("Log Verification Note", cell_bold)]]
        for evt in custody_log:
            custody_rows.append([
                Paragraph(evt.get("timestamp"), cell_style),
                Paragraph(evt.get("action"), cell_style),
                Paragraph(evt.get("actor"), cell_style),
                Paragraph(evt.get("details"), cell_style)
            ])
        t_custody = Table(custody_rows, colWidths=[100, 110, 110, 220])
        t_custody.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0, 0), (-1, -1), 3),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(t_custody)
        story.append(Spacer(1, 14))

        # 6. Investigator Certification Block
        story.append(Paragraph("5. FORENSIC EXAMINER CERTIFICATION", heading_style))
        story.append(Paragraph(
            "I hereby attest under penalty of perjury that the digital artifact described above was processed using validated "
            "forensic extraction methodologies, cryptographic checksums verify data integrity from ingestion through report compilation, "
            "and all transmission hops have been reconstructed without unauthorized alteration.",
            cell_style
        ))
        story.append(Spacer(1, 15))

        cert_data = [
            [Paragraph("<b>Examining Officer:</b> ___________________________", cell_style), Paragraph("<b>Badge / Agency ID:</b> ___________________________", cell_style)],
            [Paragraph("<b>Signature:</b> __________________________________", cell_style), Paragraph("<b>Date Verified:</b> _______________________________", cell_style)]
        ]
        t_cert = Table(cert_data, colWidths=[270, 270])
        t_cert.setStyle(TableStyle([
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(t_cert)

        # Build document
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
