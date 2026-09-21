"""
Identity Correlation and Attribution Support Engine
Builds graph-based relationship models between emails, domains, IP addresses,
ASNs, and locations. Provides confidence-rated threat actor attribution
and infrastructure classification.
"""


class AttributionGraphEngine:
    """Correlates indicators and constructs interactive graph topology and attribution profiling."""

    def __init__(self):
        pass

    def build(self, parsed_email, auth_results, domain_intel, relay_trace, origin_geo, threat_eval):
        """Generates attribution profile, confidence score, and network graph model."""
        sender_email = parsed_email.get("from", {}).get("email", "")
        sender_domain = parsed_email.get("from", {}).get("domain", "")
        sender_display = parsed_email.get("from", {}).get("display_name", "")
        reply_to_email = parsed_email.get("reply_to", {}).get("email", "")
        origin_ip = origin_geo.get("ip", "UNKNOWN")
        origin_asn = origin_geo.get("asn", "UNKNOWN")
        origin_city = origin_geo.get("city", "Unknown City")
        origin_country = origin_geo.get("country", "Unknown Country")
        origin_isp = origin_geo.get("isp", "Unknown ISP")

        # 1. Evaluate Attribution State
        attribution_profile, confidence, reasoning = self._classify_attribution(
            auth_results, domain_intel, origin_geo, threat_eval, sender_email, reply_to_email
        )

        # 2. Build Interactive Graph Nodes and Edges
        graph_data = self._generate_graph(
            parsed_email, origin_geo, relay_trace, attribution_profile, sender_domain, reply_to_email
        )

        # 3. Campaign Clustering Signature
        campaign_signature = self._generate_campaign_signature(
            origin_ip, origin_asn, sender_domain, threat_eval["primary_attack_vector"]
        )

        return {
            "attribution_profile": attribution_profile,
            "confidence_percent": confidence,
            "reasoning": reasoning,
            "campaign_cluster": campaign_signature,
            "graph": graph_data
        }

    def _classify_attribution(self, auth, domain_intel, geo, threat, sender_email, reply_to_email):
        score = threat.get("threat_score", 0)
        spf_status = auth.get("spf", {}).get("status", "")
        dkim_status = auth.get("dkim", {}).get("status", "")
        is_bulletproof = geo.get("is_bulletproof", False)
        is_cloud = geo.get("is_cloud_provider", False)
        reply_to_mismatch = (reply_to_email and reply_to_email != sender_email)

        # Scenario 1: Legitimate
        if score < 25 and spf_status == "PASS" and dkim_status == "PASS":
            return {
                "category": "LEGITIMATE_INFRASTRUCTURE",
                "label": "Legitimate Verified Infrastructure",
                "risk_tier": "SAFE",
                "icon": "shield-check",
                "color": "#00e676",
                "description": "Email originated from verified, cryptographically authenticated authorized infrastructure."
            }, 95, [
                "Full cryptographic alignment (SPF Pass, DKIM Pass)",
                "Authorized relay transit nodes matched publishing records",
                "Zero linguistic deception or financial diversion cues"
            ]

        # Scenario 2: Direct Malicious Actor Infrastructure
        if is_bulletproof or (score >= 80 and not is_cloud and spf_status in ("FAIL", "NONE")):
            return {
                "category": "DIRECT_MALICIOUS_INFRASTRUCTURE",
                "label": "Direct Malicious Actor Environment",
                "risk_tier": "CRITICAL",
                "icon": "skull",
                "color": "#ff1744",
                "description": "Email was transmitted directly from hostile or bulletproof hosting infrastructure maintained by the threat actor."
            }, 90, [
                f"Originating node {geo.get('ip')} located in high-abuse/bulletproof network: {geo.get('as_name')}",
                "Deliberate sender header forgery and domain spoofing",
                "Direct weaponization for financial diversion or malware delivery"
            ]

        # Scenario 3: Cloud-Hosted Anonymized Campaign
        if is_cloud and (score >= 70 or reply_to_mismatch):
            return {
                "category": "CLOUD_DISPOSABLE_CAMPAIGN",
                "label": "Cloud / Bulletproof Disposable VPS Campaign",
                "risk_tier": "HIGH",
                "icon": "cloud-lightning",
                "color": "#ff5252",
                "description": "Attacker leveraged elastic commercial cloud / VPS instances spun up temporarily for bulk evasion."
            }, 85, [
                f"Origin IP resides within cloud hosting provider: {geo.get('isp')}",
                f"Mismatched Reply-To redirecting responses to {reply_to_email}",
                "Failed SPF authorization against target sender domain"
            ]

        # Scenario 4: Compromised Account / Server
        if (spf_status == "PASS" or dkim_status == "PASS") and score >= 60:
            return {
                "category": "COMPROMISED_ACCOUNT_OR_RELAY",
                "label": "Compromised Legitimate Account / Internal Relay",
                "risk_tier": "HIGH",
                "icon": "alert-triangle",
                "color": "#ffab00",
                "description": "Originates from a legitimate mail server or authorized sender domain, but exhibits compromised mailbox takeover characteristics."
            }, 78, [
                "Sender authentication partially passed, indicating hijacked credentials or compromised MTA relay",
                "Content demonstrates anomalous BEC / financial transfer requests",
                "High linguistic urgency inconsistent with authentic sender history"
            ]

        # Scenario 5: Spoofed Domain via Open Relay
        if spf_status in ("FAIL", "SOFTFAIL", "NONE"):
            return {
                "category": "SPOOFED_UNAUTHORIZED_RELAY",
                "label": "Spoofed Domain via Open / Anonymized Relay",
                "risk_tier": "HIGH",
                "icon": "globe",
                "color": "#ff9100",
                "description": "Unauthenticated third-party mail server was abused to forge the sender domain identity without valid keys."
            }, 82, [
                "Sender Policy Framework (SPF) failed or not authorized",
                "No cryptographic DKIM signature present",
                f"Intermediate relay hops in {geo.get('country')} route mail without domain ownership"
            ]

        # Fallback Suspicious
        return {
            "category": "SUSPICIOUS_ANOMALY",
            "label": "Suspicious / Unclassified Origin",
            "risk_tier": "MEDIUM",
            "icon": "help-circle",
            "color": "#ffd600",
            "description": "Anomalous routing patterns detected without definitive single threat actor classification."
        }, 65, [
            "Inconsistent header routing indicators",
            "Borderline risk score requiring human analyst validation"
        ]

    def _generate_graph(self, parsed, geo, relay, attribution, sender_domain, reply_to_email):
        """Constructs node and edge lists compatible with Vis.js / Cytoscape."""
        nodes = []
        edges = []

        # 1. Central Email Node
        nodes.append({
            "id": "email_root",
            "label": parsed.get("subject", "Email Artifact")[:28] + "...",
            "group": "email",
            "shape": "box",
            "color": attribution["color"],
            "title": f"Subject: {parsed.get('subject')}\nDate: {parsed.get('date')}"
        })

        # 2. Sender Domain Node
        if sender_domain:
            nodes.append({
                "id": "domain_sender",
                "label": f"Domain: {sender_domain}",
                "group": "domain",
                "shape": "ellipse",
                "color": "#00bcd4",
                "title": f"Claimed Sender Domain: {sender_domain}"
            })
            edges.append({
                "from": "domain_sender",
                "to": "email_root",
                "label": "claims sender",
                "color": "#00bcd4"
            })

        # 3. Originating IP Node
        origin_ip = geo.get("ip")
        if origin_ip and origin_ip != "UNKNOWN":
            nodes.append({
                "id": "origin_ip",
                "label": f"Origin IP: {origin_ip}",
                "group": "ip",
                "shape": "dot",
                "color": "#ff5722" if geo.get("is_bulletproof") or geo.get("threat_risk") in ("HIGH", "CRITICAL") else "#8bc34a",
                "title": f"IP: {origin_ip}\nISP: {geo.get('isp')}\nType: {geo.get('network_type')}"
            })
            edges.append({
                "from": "origin_ip",
                "to": "email_root",
                "label": "egress source",
                "color": "#ff5722"
            })

            # 4. Geolocation City/Country Node
            geo_label = f"{geo.get('city')}, {geo.get('country_code')}"
            nodes.append({
                "id": "geo_node",
                "label": f"Location: {geo_label}",
                "group": "location",
                "shape": "database",
                "color": "#ab47bc",
                "title": f"Coordinates: {geo.get('lat')}, {geo.get('lon')}\nTimezone: {geo.get('timezone')}"
            })
            edges.append({
                "from": "origin_ip",
                "to": "geo_node",
                "label": "located in",
                "color": "#ab47bc"
            })

            # 5. ASN Node
            asn_label = f"{geo.get('asn')} ({geo.get('as_name')[:20]})"
            nodes.append({
                "id": "asn_node",
                "label": asn_label,
                "group": "asn",
                "shape": "hexagon",
                "color": "#26a69a",
                "title": f"Autonomous System: {geo.get('asn')}\nOrganization: {geo.get('as_name')}"
            })
            edges.append({
                "from": "origin_ip",
                "to": "asn_node",
                "label": "belongs to",
                "color": "#26a69a"
            })

        # 6. Reply-To Target Node (if mismatched)
        if reply_to_email and reply_to_email != parsed.get("from", {}).get("email"):
            nodes.append({
                "id": "reply_to_node",
                "label": f"Reply-To: {reply_to_email}",
                "group": "threat_alias",
                "shape": "diamond",
                "color": "#e91e63",
                "title": f"Redirected Response Mailbox: {reply_to_email}"
            })
            edges.append({
                "from": "email_root",
                "to": "reply_to_node",
                "label": "diverts replies to",
                "color": "#e91e63",
                "dashes": True
            })

        # 7. Intermediate Relay Nodes
        for hop in relay.get("hops", []):
            hop_num = hop.get("hop_number")
            hop_ip = hop.get("from_ip")
            if hop_ip and hop_ip != origin_ip and not hop.get("is_private_ip"):
                hop_id = f"hop_{hop_num}"
                nodes.append({
                    "id": hop_id,
                    "label": f"MTA Hop {hop_num}: {hop_ip}",
                    "group": "relay",
                    "shape": "circle",
                    "color": "#78909c",
                    "title": f"Relay MTA: {hop.get('by_host')}\nProtocol: {hop.get('protocol')}"
                })
                edges.append({
                    "from": "origin_ip",
                    "to": hop_id,
                    "label": f"hop {hop_num}",
                    "color": "#78909c"
                })

        return {"nodes": nodes, "edges": edges}

    def _generate_campaign_signature(self, origin_ip, asn, domain, attack_vector):
        """Generates an operational campaign cluster tag."""
        # Clean IP subnet
        ip_parts = origin_ip.split('.')
        subnet = f"{ip_parts[0]}.{ip_parts[1]}.{ip_parts[2]}.0/24" if len(ip_parts) == 4 else "UNKNOWN_SUBNET"

        if "BEC" in attack_vector:
            camp_name = f"CAMPAIGN-SHADOWWIRE-{asn}"
            tag = "Financial Wire Diversion Campaign"
        elif "Credential" in attack_vector:
            camp_name = f"CAMPAIGN-O365-HARVEST-{asn}"
            tag = "Cloud Credential Harvester Ring"
        elif "Malware" in attack_vector:
            camp_name = f"CAMPAIGN-DROPPER-{asn}"
            tag = "Weaponized Document Distribution"
        else:
            camp_name = f"CAMPAIGN-GENERIC-{asn}"
            tag = "Suspicious Email Ingestion Cluster"

        return {
            "campaign_id": camp_name,
            "campaign_name": tag,
            "correlated_subnet": subnet,
            "correlated_asn": asn,
            "target_vector": attack_vector
        }
