// CyberTrace AI TypeScript Definitions

export type ThreatClassification = 
  | 'Legitimate' 
  | 'Suspicious' 
  | 'Phishing' 
  | 'Impersonation' 
  | 'Fraud-related';

export type RiskTier = 'SAFE' | 'SUSPICIOUS' | 'HIGH' | 'CRITICAL';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type Severity = 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';
export type AuthStatus = 'Pass' | 'Fail' | 'Softfail' | 'Neutral' | 'None' | 'Unknown' | 'Not Available';

export interface DetectionFinding {
  id: string;
  title: string;
  severity: Severity;
  explanation: string;
  evidence_ref: string;
  details: string;
}

export interface RecommendedAction {
  action: string;
  priority: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface RelayHop {
  hop_number: number;
  receiving_host: string;
  sending_host: string;
  ip: string;
  timestamp: string;
  delay_seconds: number;
  country?: string;
  city?: string;
  asn?: string;
  isp?: string;
  is_suspicious?: boolean;
  evidence_note?: string;
}

export interface ExtractedURL {
  url: string;
  anchor_text: string;
  domain?: string;
  scheme?: string;
  is_shortener?: boolean;
  is_homoglyph?: boolean;
  risk?: Severity;
}

export interface AuthResults {
  spf: {
    status: string;
    domain?: string;
    ip?: string;
    raw_spf_header?: string;
  };
  dkim: {
    status: string;
    domain?: string;
    selector?: string;
    aligned?: boolean;
  };
  dmarc: {
    status: string;
    policy?: string;
    domain?: string;
    aligned?: boolean;
  };
  alignment: {
    spf_aligned: boolean;
    dkim_aligned: boolean;
    reply_to_match: boolean;
    return_path_match: boolean;
  };
  raw_results_header?: string;
}

export interface CustodyEvent {
  event: string;
  timestamp: string;
  officer: string;
  note: string;
  hash_verified: boolean;
}

export interface ThreatAnalysis {
  id: string;
  subject: string;
  sender: string;
  recipient: string;
  risk_score: number;
  risk_tier: RiskTier;
  threat_classification: ThreatClassification;
  confidence_level: ConfidenceLevel;
  created_at: string;
  filename: string;
  findings: DetectionFinding[];
  recommended_actions: RecommendedAction[];
  limitations: string;
  parsed: {
    subject: string;
    date: string;
    message_id: string;
    from: {
      raw: string;
      display_name: string;
      email: string;
      domain: string;
    };
    to: string;
    cc?: string;
    reply_to: {
      raw: string;
      display_name: string;
      email: string;
      domain: string;
    };
    return_path: {
      raw: string;
      email: string;
      domain: string;
    };
    raw_headers_list: Array<{ name: string; value: string }>;
    body_text: string;
    body_html?: string;
    attachments: Array<{
      filename: string;
      content_type: string;
      size_bytes: number;
      sha256: string;
    }>;
    urls: ExtractedURL[];
    raw_text: string;
  };
  relay_hops: RelayHop[];
  origin_node: {
    ip: string;
    hop: number;
    geo?: {
      ip: string;
      country: string;
      region?: string;
      city: string;
      asn: string;
      isp: string;
      is_bulletproof?: boolean;
      is_vpn_or_tor?: boolean;
      is_cloud_provider?: boolean;
      threat_risk?: string;
    };
  };
  auth: AuthResults;
  domain_intel: {
    is_typosquatting: boolean;
    is_homoglyph: boolean;
    targeted_brand?: string;
    similarity?: number;
    squat_type?: string;
  };
  evidence: {
    hashes: {
      sha256: string;
      sha1: string;
      md5: string;
      size_bytes: number;
    };
    custody_log: CustodyEvent[];
  };
  urls: ExtractedURL[];
}

export interface CaseItem {
  id: string;
  title: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Under Investigation' | 'Evidence Review' | 'Resolved' | 'Closed';
  assigned_analyst: string;
  description: string;
  created_at: string;
  updated_at: string;
  related_analysis_id?: string;
  notes: Array<{
    id: string;
    author: string;
    timestamp: string;
    text: string;
  }>;
  evidence_ids: string[];
  timeline: Array<{
    time: string;
    event: string;
  }>;
}

export interface AlertItem {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  alert_type: string;
  related_email_subject: string;
  sender: string;
  status: 'Active' | 'Under Review' | 'Escalated' | 'Dismissed';
  created_at: string;
  assigned_analyst: string;
  analysis_id?: string;
  case_id?: string;
  notes?: string;
}

export interface EvidenceItem {
  id: string;
  filename: string;
  file_type: string;
  sha256: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  case_id?: string;
  description: string;
  chain_of_custody: CustodyEvent[];
}

export interface ForensicReport {
  id: string;
  case_id?: string;
  title: string;
  created_by: string;
  generated_at: string;
  status: 'Draft' | 'Finalized' | 'Archived';
  summary: string;
  report_data: {
    report_id: string;
    case_id?: string;
    title: string;
    created_by: string;
    timestamp: string;
    status: string;
    case_title?: string;
    observed_facts: string[];
    automated_findings: string[];
    interpretations: string[];
    unavailable_evidence: string[];
    limitations: string;
  };
}

export interface DemoSample {
  id: string;
  name: string;
  threat_profile: string;
  origin_location: string;
  risk_tier: string;
  description: string;
  raw_eml: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'case' | 'email' | 'domain' | 'ip' | 'mail_server' | 'url' | 'indicator';
  risk: 'critical' | 'high' | 'medium' | 'suspicious' | 'safe' | 'legitimate';
}

export interface GraphLink {
  source: string;
  target: string;
  relation: string;
}
