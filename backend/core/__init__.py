"""
Email Forensics and Intelligence Platform Core Engine.
"""

from .parser import EmailForensicParser
from .relay_tracer import RelayHopTracer
from .auth_validator import AuthProtocolValidator
from .ip_intelligence import IPIntelligenceEngine
from .domain_intel import DomainIntelligenceEngine
from .threat_engine import ThreatDetectionEngine
from .attribution_graph import AttributionGraphEngine
from .compliance import ComplianceAndEvidenceLocker
from .samples import get_forensic_samples

__all__ = [
    "EmailForensicParser",
    "RelayHopTracer",
    "AuthProtocolValidator",
    "IPIntelligenceEngine",
    "DomainIntelligenceEngine",
    "ThreatDetectionEngine",
    "AttributionGraphEngine",
    "ComplianceAndEvidenceLocker",
    "get_forensic_samples",
]
