from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class EmailAnalyzeRequest(BaseModel):
    eml_text: Optional[str] = None
    filename: Optional[str] = None
    from_addr: Optional[str] = None
    to_addr: Optional[str] = None
    subject: Optional[str] = None
    reply_to: Optional[str] = None
    return_path: Optional[str] = None
    message_id: Optional[str] = None

class CaseCreateRequest(BaseModel):
    title: str
    priority: str = "High"
    status: str = "Open"
    assigned_analyst: str = "Lead Forensic Analyst"
    description: Optional[str] = ""
    related_analysis_id: Optional[str] = None
    evidence_ids: Optional[List[str]] = []

class CaseUpdateRequest(BaseModel):
    title: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_analyst: Optional[str] = None
    description: Optional[str] = None
    note: Optional[str] = None
    evidence_id: Optional[str] = None

class AlertReviewRequest(BaseModel):
    status: str
    reason: Optional[str] = None
    create_case: Optional[bool] = False
    assigned_analyst: Optional[str] = None

class EvidenceCreateRequest(BaseModel):
    filename: str
    file_type: str = ".eml"
    content: Optional[str] = ""
    sha256: Optional[str] = None
    file_size: Optional[int] = 0
    case_id: Optional[str] = None
    description: Optional[str] = ""
    uploaded_by: str = "Forensic Investigator"

class ReportGenerateRequest(BaseModel):
    case_id: Optional[str] = None
    analysis_id: Optional[str] = None
    title: str
    created_by: str = "Forensic Intelligence Unit"
    executive_summary: Optional[str] = None
