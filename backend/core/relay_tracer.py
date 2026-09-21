"""
Relay Hop and Transmission Path Tracer
Parses chronological Received header chains, identifies public vs private IPs,
computes hop-by-hop latency, flags routing anomalies, and pinpoints the
Earliest Reliable Originating Node.
"""

import re
import ipaddress
from datetime import datetime
from email.utils import parsedate_to_datetime


class RelayHopTracer:
    """Reconstructs and analyzes the SMTP transmission chain."""

    # Matches IPv4 addresses
    IPV4_PATTERN = re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b')
    # Matches IPv6 addresses in headers
    IPV6_PATTERN = re.compile(r'(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}')

    def __init__(self, received_headers, x_originating_ip=""):
        self.raw_received = received_headers or []
        self.x_originating_ip = (x_originating_ip or "").strip('[] ')

    def trace(self):
        """Analyzes the Received headers in reverse order (bottom to top = sender to recipient)."""
        hops = []
        anomalies = []

        # Standard email headers list Received headers in reverse: top is most recent, bottom is earliest.
        # Reverse to get chronological order (earliest first: Hop 1 -> Hop N)
        chronological_headers = list(reversed(self.raw_received))

        prev_timestamp = None

        for idx, raw_hdr in enumerate(chronological_headers, start=1):
            parsed_hop = self._parse_single_hop(raw_hdr, idx)
            
            # Latency check
            if parsed_hop["timestamp_dt"] and prev_timestamp:
                delta_sec = (parsed_hop["timestamp_dt"] - prev_timestamp).total_seconds()
                parsed_hop["delay_seconds"] = max(0, delta_sec)
                if delta_sec < -120:  # More than 2 minutes backwards
                    anomalies.append({
                        "type": "CLOCK_SKEW_OR_FORGERY",
                        "hop": idx,
                        "description": f"Hop {idx} timestamp is {abs(delta_sec):.0f}s earlier than previous hop. Possible clock skew or forged synthetic header.",
                        "severity": "HIGH"
                    })
            else:
                parsed_hop["delay_seconds"] = 0

            if parsed_hop["timestamp_dt"]:
                prev_timestamp = parsed_hop["timestamp_dt"]

            hops.append(parsed_hop)

        # Check for empty hops
        if not hops and self.x_originating_ip:
            # Synthetic single hop from X-Originating-IP
            hops.append({
                "hop_number": 1,
                "raw": f"X-Originating-IP: [{self.x_originating_ip}]",
                "from_host": "client-endpoint",
                "from_ip": self.x_originating_ip,
                "by_host": "inbound-gateway",
                "protocol": "HTTP/SMTP",
                "timestamp_str": "",
                "timestamp_dt": None,
                "delay_seconds": 0,
                "is_private_ip": self.is_private_ip(self.x_originating_ip),
                "anomalies": []
            })

        # Identify earliest reliable sending node
        origin_node = self._find_earliest_reliable_node(hops)

        # Detect routing anomalies across hops
        if len(hops) > 12:
            anomalies.append({
                "type": "EXCESSIVE_HOPS",
                "hop": len(hops),
                "description": f"Abnormally high number of relay hops ({len(hops)}). Typical legitimate mail has 2-5 hops.",
                "severity": "MEDIUM"
            })

        return {
            "total_hops": len(hops),
            "hops": hops,
            "origin_node": origin_node,
            "anomalies": anomalies
        }

    def _parse_single_hop(self, header_str, hop_num):
        clean_hdr = " ".join(header_str.split())

        from_host = ""
        from_ip = ""
        by_host = ""
        protocol = ""
        timestamp_str = ""
        timestamp_dt = None
        hop_anomalies = []

        # Split on semicolon to get date part if present
        parts = clean_hdr.split(';')
        if len(parts) > 1:
            timestamp_str = parts[-1].strip()
            routing_part = ";".join(parts[:-1]).strip()
            try:
                timestamp_dt = parsedate_to_datetime(timestamp_str)
            except Exception:
                timestamp_dt = None
        else:
            routing_part = clean_hdr

        # Extract 'from ...'
        from_match = re.search(r'\bfrom\s+([^\s]+(?:\s+\([^)]+\))?)', routing_part, re.IGNORECASE)
        if from_match:
            from_raw = from_match.group(1)
            from_host = from_raw.split()[0].rstrip(';:,')
            
            # Find IP in from_raw
            ip_matches = self.IPV4_PATTERN.findall(from_raw)
            if ip_matches:
                from_ip = ip_matches[0]
            else:
                ipv6_matches = self.IPV6_PATTERN.findall(from_raw)
                if ipv6_matches:
                    from_ip = ipv6_matches[0]

        # Extract 'by ...'
        by_match = re.search(r'\bby\s+([^\s]+)', routing_part, re.IGNORECASE)
        if by_match:
            by_host = by_match.group(1).rstrip(';:,')

        # Extract 'with ...'
        with_match = re.search(r'\bwith\s+([^\s]+)', routing_part, re.IGNORECASE)
        if with_match:
            protocol = with_match.group(1).rstrip(';:,')

        # Fallback if from_ip wasn't in 'from' section, check the whole routing part
        if not from_ip:
            all_ips = self.IPV4_PATTERN.findall(routing_part)
            if all_ips:
                from_ip = all_ips[0]

        is_priv = self.is_private_ip(from_ip) if from_ip else False

        # Hop anomaly: untrusted or missing from host
        if not from_host and not from_ip:
            hop_anomalies.append("Header does not declare sending client host or IP")

        return {
            "hop_number": hop_num,
            "raw": clean_hdr,
            "from_host": from_host,
            "from_ip": from_ip,
            "by_host": by_host,
            "protocol": protocol,
            "timestamp_str": timestamp_str,
            "timestamp_dt": timestamp_dt,
            "delay_seconds": 0,
            "is_private_ip": is_priv,
            "anomalies": hop_anomalies
        }

    def _find_earliest_reliable_node(self, hops):
        """Identifies the earliest node in the relay chain that provides a public IP."""
        # Check X-Originating-IP first if valid public IP
        if self.x_originating_ip and not self.is_private_ip(self.x_originating_ip):
            return {
                "ip": self.x_originating_ip,
                "source": "X-Originating-IP Header",
                "hop_number": 0,
                "confidence": "HIGH",
                "note": "Extracted directly from client origin header"
            }

        # Otherwise search hops from earliest (hop 1) forward
        for hop in hops:
            ip = hop.get("from_ip", "")
            if ip and not self.is_private_ip(ip):
                return {
                    "ip": ip,
                    "source": f"Received Hop {hop['hop_number']}",
                    "hop_number": hop["hop_number"],
                    "from_host": hop.get("from_host", ""),
                    "by_host": hop.get("by_host", ""),
                    "confidence": "HIGH" if hop["hop_number"] <= 2 else "MEDIUM",
                    "note": f"Earliest public transmission node identified at hop {hop['hop_number']}"
                }

        # If all public IPs missing, fallback to any available IP
        for hop in hops:
            ip = hop.get("from_ip", "")
            if ip:
                return {
                    "ip": ip,
                    "source": f"Received Hop {hop['hop_number']} (Internal)",
                    "hop_number": hop["hop_number"],
                    "confidence": "LOW",
                    "note": "Private / RFC1918 address (no external public egress node in headers)"
                }

        return {
            "ip": "UNKNOWN",
            "source": "None",
            "hop_number": None,
            "confidence": "NONE",
            "note": "No originating IP could be identified from transmission headers"
        }

    @staticmethod
    def is_private_ip(ip_str):
        if not ip_str:
            return True
        try:
            ip_obj = ipaddress.ip_address(ip_str.strip())
            return ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved
        except ValueError:
            return True
