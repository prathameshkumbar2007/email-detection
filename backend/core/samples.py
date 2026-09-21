"""
Pre-Packaged Realistic Forensic Email Samples
Provides 5 diverse, high-fidelity real-world email threat profiles
for instant demonstration and analyst evaluation.
"""

def get_forensic_samples():
    """Returns catalog of realistic forensic test samples."""
    return [
        {
            "id": "bec_wire_transfer",
            "name": "Executive BEC Wire Transfer (CEO Impersonation)",
            "threat_profile": "Business Email Compromise (Financial Diversion)",
            "origin_location": "Moscow, Russia (Bulletproof Cloud)",
            "risk_tier": "CRITICAL",
            "description": "C-level executive impersonation demanding urgent $78,500 wire transfer for an acquisition with diverted Reply-To address.",
            "raw_eml": """Received: from mail-relay.inbound-corp.net (194.180.174.10) by mx.enterprise-gateway.com (40.107.93.72) with ESMTPS id 48a7d1; Mon, 07 Sep 2026 13:20:15 +0000
Received: from vps-bulletproof-node.ru (185.220.101.5) by mail-relay.inbound-corp.net with ESMTP id bc9192; Mon, 07 Sep 2026 13:19:48 +0000
From: "Marcus Vance (CEO)" <marcus.vance@vance-holdings.com>
To: "Sarah Jenkins (Senior Controller)" <sjenkins@vance-holdings.com>
Reply-To: "Marcus Vance" <marcus.vance.exec@mail-consulting.ru>
Return-Path: <bounce-daemon@vps-bulletproof-node.ru>
Subject: URGENT & CONFIDENTIAL: Priority Wire Transfer - Project Titan Acquisition
Date: Mon, 07 Sep 2026 13:19:30 +0000
Message-ID: <20260907131930.9842.vps@vps-bulletproof-node.ru>
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Authentication-Results: mx.enterprise-gateway.com; spf=fail (domain of vance-holdings.com does not designate 185.220.101.5 as permitted sender); dkim=none; dmarc=fail action=none
Received-SPF: Fail (mx.enterprise-gateway.com: domain of vance-holdings.com does not designate 185.220.101.5)

Sarah,

I am currently in an all-day confidential executive board session regarding the Project Titan acquisition and cannot take phone calls right now. Reach me via email only.

We need to release an initial earnest deposit payment today of $78,500 USD to our legal escrow account before 4:00 PM EST to finalize closing terms. 

Please process this immediate wire transfer promptly to the updated banking instructions below:

Beneficiary Name: Titan Escrow Holdings LLC
Bank Name: Global Settlement Commercial Bank
Account Number: 884920194821
Routing Number: 021000021
Swift Code: GSCOMMUS33

Keep this matter strictly confidential between us until the formal press release tomorrow morning. Reply back immediately with the wire confirmation receipt once transmitted.

Regards,

Marcus Vance
Chief Executive Officer
Vance Holdings Group
"""
        },
        {
            "id": "o365_credential_harvester",
            "name": "Microsoft 365 Credential Harvester (Homoglyph & Punycode)",
            "threat_profile": "Credential Harvesting Phishing",
            "origin_location": "Victoria, Seychelles (Anonymized VPS)",
            "risk_tier": "HIGH",
            "description": "Urgent password expiry notification leveraging visual homoglyphs and disguised hyperlink to steal tenant credentials.",
            "raw_eml": """Received: from outlook-ingress.corp-filter.com (54.240.27.18) by mx.target-corp.com with ESMTPS id 92384; Mon, 07 Sep 2026 10:14:22 +0000
Received: from offshore-gateway.net (197.234.242.18) by outlook-ingress.corp-filter.com with ESMTP id sc8231; Mon, 07 Sep 2026 10:13:55 +0000
From: "Microsoft 365 Support Team" <admin@micros0ft-login.com>
To: "User Account" <employee@target-corp.com>
Return-Path: <notifications@offshore-gateway.net>
Subject: Action Required: Your Microsoft 365 Password Expires in 2 Hours
Date: Mon, 07 Sep 2026 10:13:40 +0000
Message-ID: <MS365-NOTICE-992381@micros0ft-login.com>
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8
Authentication-Results: mx.target-corp.com; spf=softfail; dkim=none; dmarc=fail

<html>
<body>
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2 style="color: #0078d4;">Microsoft Office 365 Security Alert</h2>
    <p>Dear Valued User,</p>
    <p>Your institutional Microsoft 365 account password is scheduled to expire <b>within 2 hours</b>. If not updated immediately, your mailbox and cloud storage access will be permanently locked.</p>
    <p>To retain your existing password and prevent account suspension, please re-authenticate your session now:</p>
    <p style="margin: 25px 0;">
        <a href="http://197.234.242.18/login/microsoft-sso/verify.php" style="background: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            https://login.microsoftonline.com/common/oauth2/authorize
        </a>
    </p>
    <p style="font-size: 11px; color: #888;">This is an automated administrative notification. Do not reply to this email.</p>
</div>
</body>
</html>
"""
        },
        {
            "id": "bank_account_suspension",
            "name": "Bank Fraud Alert (Combosquatting & Display Impersonation)",
            "threat_profile": "Financial Impersonation & Phishing",
            "origin_location": "Lagos, Nigeria (Residential Compromised IP)",
            "risk_tier": "HIGH",
            "description": "Deceptive consumer bank fraud alert with high-risk TLD and mismatched links.",
            "raw_eml": """Received: from smtp-in.security-filter.com (194.180.174.10) by mx.user-mail.com with ESMTPS id ff1029; Mon, 07 Sep 2026 08:45:10 +0000
Received: from 102.89.23.114 (102.89.23.114) by smtp-in.security-filter.com with SMTP id ng821; Mon, 07 Sep 2026 08:44:40 +0000
From: "Bank of America Fraud Center" <security-alerts@bankofamerica-secure-verify.xyz>
To: "Customer" <cardholder@user-mail.com>
Return-Path: <bounce@bankofamerica-secure-verify.xyz>
Subject: IMMEDIATE ACTION: Suspicious Debit Card Transaction Detected ($1,480.00)
Date: Mon, 07 Sep 2026 08:44:12 +0000
Message-ID: <BOA-ALERT-771239@bankofamerica-secure-verify.xyz>
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Authentication-Results: mx.user-mail.com; spf=none; dkim=none; dmarc=fail

Bank of America Customer Security Notice:

We detected an unauthorized pending transaction of $1,480.00 USD on your debit card ending in 4108 at a foreign merchant. 

Your account has been temporarily restricted to protect your balance. If you did not authorize this payment, you must verify your identity immediately within 24 hours to dispute the charge and prevent permanent account lock:

Verify Account Now:
http://102.89.23.114/boa-verification/dispute?case=8831920

Bank of America Fraud Prevention Operations
100 N Tryon St, Charlotte, NC 28255
"""
        },
        {
            "id": "malware_macro_dropper",
            "name": "Spear-Phishing with Macro Attachment (Malware Weaponization)",
            "threat_profile": "Weaponized Document / Dropper Malware",
            "origin_location": "Kyiv, Ukraine (Offshore VPS)",
            "risk_tier": "CRITICAL",
            "description": "Targeted HR benefits lure containing weaponized macro-enabled Excel document (.xlsm) sent via open relay.",
            "raw_eml": """Received: from relay-node.corp-dmz.com (54.240.27.18) by mail.target-company.com with ESMTPS id 33918; Mon, 07 Sep 2026 11:05:33 +0000
Received: from offshore-relay.org (91.240.118.42) by relay-node.corp-dmz.com with ESMTP id ua991; Mon, 07 Sep 2026 11:05:01 +0000
From: "Corporate Human Resources" <hr-payroll@target-corp-benefits.work>
To: "All Employees" <staff@target-company.com>
Subject: URGENT: Revised 2026 Q3 Bonus Matrix & Healthcare Benefit Schedule.xlsm
Date: Mon, 07 Sep 2026 11:04:40 +0000
Message-ID: <HR-BONUS-2026-09@offshore-relay.org>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="====HR_BENEFITS_BOUNDARY===="
Authentication-Results: mail.target-company.com; spf=fail; dkim=none; dmarc=fail

--====HR_BENEFITS_BOUNDARY====
Content-Type: text/plain; charset=UTF-8

Team,

Please review the attached updated Q3 Bonus Schedule and Healthcare Coverage amendments. 

Action Required: All full-time employees must open the attached spreadsheet, enable macros to load the encrypted compensation formulas, and confirm acceptance by 5:00 PM today.

Failure to review will result in deferred bonus disbursement for this quarter.

Sincerely,
Global Benefits & Human Resources
--====HR_BENEFITS_BOUNDARY====
Content-Type: application/vnd.ms-excel.sheet.macroEnabled.12; name="Q3_Bonus_Calculation_Schedule.xlsm"
Content-Disposition: attachment; filename="Q3_Bonus_Calculation_Schedule.xlsm"
Content-Transfer-Encoding: base64

UEsDBBQAAAAIAKGQWVkAAAAAAAAAAAAAAAAYAAAAeGwvdmJhUHJvamVjdC5iaW4vY29kZXVyZ2Vu
dC52YnNBdXRvRXhlY3V0ZUZpbGVBZHZhbmNlZFNwZWFyUGhpc2hpbmdXaXJlVHJhbnNmZXJTYW1w
bGVFdmFsdWF0aW9uQ2hhcmFjdGVyc0ZvcmVuc2ljc0NlcnRpZmljYXRpb25IYXNoVG9vbHM=
--====HR_BENEFITS_BOUNDARY====--
"""
        },
        {
            "id": "legitimate_newsletter",
            "name": "Verified Corporate Security Bulletin (Authentic Baseline)",
            "threat_profile": "Verified Authentic Communication",
            "origin_location": "Denver, Colorado, US (Twilio SendGrid)",
            "risk_tier": "SAFE",
            "description": "Authentic enterprise email demonstrating full SPF/DKIM/DMARC cryptographic alignment, zero threat indicators, and legitimate relay paths.",
            "raw_eml": """Received: from mail-relay.target-enterprise.com (209.85.220.41) by mx.customer-domain.com with ESMTPS id 19823; Mon, 07 Sep 2026 09:12:30 +0000
Received: from o1.ptr982.sendgrid.net (167.89.86.12) by mail-relay.target-enterprise.com with ESMTPS id sg1029; Mon, 07 Sep 2026 09:12:12 +0000
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=cloudflare.com; s=s1; t=1757236332; h=from:subject:date:message-id:to:mime-version:content-type; bh=47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=; b=k823aJ...
Received-SPF: Pass (mail-relay.target-enterprise.com: domain of cloudflare.com designates 167.89.86.12 as permitted sender)
Authentication-Results: mx.customer-domain.com; spf=pass (sender IP is 167.89.86.12) smtp.mailfrom=radar-digest@cloudflare.com; dkim=pass header.d=cloudflare.com; dmarc=pass (p=reject) header.from=cloudflare.com
From: "Cloudflare Radar Team" <radar-digest@cloudflare.com>
To: "Security Analyst" <analyst@customer-domain.com>
Return-Path: <radar-digest@cloudflare.com>
Subject: Cloudflare Radar: Monthly Global Internet Traffic and Security Insights
Date: Mon, 07 Sep 2026 09:12:00 +0000
Message-ID: <radar-digest-20260907@cloudflare.com>
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8

<html>
<body>
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
    <h2 style="color: #f6821f;">Cloudflare Radar Monthly Overview</h2>
    <p>Hello Security Community,</p>
    <p>Welcome to this month's digest of global Internet traffic trends, routing anomaly distributions, and DDoS attack patterns observed across our global network.</p>
    <ul>
        <li>Global HTTP request volume increased by 4.2% year-over-year.</li>
        <li>DNS-over-HTTPS adoption saw record expansion across European networks.</li>
        <li>BGP route leak events were mitigated in sub-second intervals across major tier-1 backbones.</li>
    </ul>
    <p>Explore the full interactive data explorer on our public research portal:</p>
    <p><a href="https://radar.cloudflare.com" style="color: #0051c3; text-decoration: underline;">https://radar.cloudflare.com</a></p>
    <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">You are receiving this bulletin because you subscribed to Cloudflare Radar updates.</p>
</div>
</body>
</html>
"""
        }
    ]
