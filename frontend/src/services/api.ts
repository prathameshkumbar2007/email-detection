import { ThreatAnalysis, CaseItem, AlertItem, EvidenceItem, ForensicReport, DemoSample, GraphNode, GraphLink } from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchDemoSamples(): Promise<DemoSample[]> {
  const res = await fetch(`${API_BASE}/demo/samples`);
  if (!res.ok) throw new Error('Failed to fetch demo samples');
  return res.json();
}

export async function resetDemoEnvironment(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo environment');
  return res.json();
}

export async function analyzeEmail(payload: {
  eml_text?: string;
  filename?: string;
  from_addr?: string;
  to_addr?: string;
  subject?: string;
  reply_to?: string;
  return_path?: string;
  message_id?: string;
}): Promise<ThreatAnalysis> {
  const res = await fetch(`${API_BASE}/email/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Email analysis request failed');
  return res.json();
}

export async function fetchAnalyses(): Promise<Array<{
  id: string;
  subject: string;
  sender: string;
  recipient: string;
  risk_score: number;
  risk_tier: string;
  threat_classification: string;
  confidence_level: string;
  created_at: string;
}>> {
  const res = await fetch(`${API_BASE}/email/analyses`);
  if (!res.ok) throw new Error('Failed to fetch analyses');
  return res.json();
}

export async function fetchAnalysisById(id: string): Promise<ThreatAnalysis> {
  const res = await fetch(`${API_BASE}/email/analyses/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch analysis ${id}`);
  return res.json();
}

export async function fetchCases(statusFilter?: string, priority?: string): Promise<CaseItem[]> {
  const params = new URLSearchParams();
  if (statusFilter) params.append('status_filter', statusFilter);
  if (priority) params.append('priority', priority);
  const res = await fetch(`${API_BASE}/cases?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch cases');
  return res.json();
}

export async function fetchCaseById(id: string): Promise<CaseItem> {
  const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch case ${id}`);
  return res.json();
}

export async function createCase(data: {
  title: string;
  priority?: string;
  status?: string;
  assigned_analyst?: string;
  description?: string;
  related_analysis_id?: string;
  evidence_ids?: string[];
}): Promise<CaseItem> {
  const res = await fetch(`${API_BASE}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create case');
  return res.json();
}

export async function updateCase(id: string, data: {
  title?: string;
  priority?: string;
  status?: string;
  assigned_analyst?: string;
  description?: string;
  note?: string;
  evidence_id?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update case ${id}`);
  return res.json();
}

export async function fetchAlerts(severity?: string): Promise<AlertItem[]> {
  const params = new URLSearchParams();
  if (severity) params.append('severity', severity);
  const res = await fetch(`${API_BASE}/alerts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function reviewAlert(id: string, data: {
  status: string;
  reason?: string;
  create_case?: boolean;
  assigned_analyst?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(id)}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to review alert ${id}`);
  return res.json();
}

export async function fetchEvidence(): Promise<EvidenceItem[]> {
  const res = await fetch(`${API_BASE}/evidence`);
  if (!res.ok) throw new Error('Failed to fetch evidence');
  return res.json();
}

export async function createEvidence(data: {
  filename: string;
  file_type?: string;
  content?: string;
  sha256?: string;
  file_size?: number;
  case_id?: string;
  description?: string;
  uploaded_by?: string;
}): Promise<EvidenceItem> {
  const res = await fetch(`${API_BASE}/evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to register evidence');
  return res.json();
}

export async function fetchReports(): Promise<ForensicReport[]> {
  const res = await fetch(`${API_BASE}/reports`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export async function fetchReportById(id: string): Promise<ForensicReport> {
  const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch report ${id}`);
  return res.json();
}

export async function generateReport(data: {
  case_id?: string;
  analysis_id?: string;
  title: string;
  created_by?: string;
  executive_summary?: string;
}): Promise<ForensicReport> {
  const res = await fetch(`${API_BASE}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to generate report');
  return res.json();
}

export async function lookupThreatIntel(q: string): Promise<any> {
  const res = await fetch(`${API_BASE}/intel/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Threat intelligence query failed');
  return res.json();
}

export async function fetchGraphData(): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  const res = await fetch(`${API_BASE}/graph/data`);
  if (!res.ok) throw new Error('Failed to fetch infrastructure graph data');
  return res.json();
}

export async function addCaseNote(id: string, note: string, author?: string): Promise<CaseItem> {
  return updateCase(id, { note, assigned_analyst: author });
}

export async function updateAlertStatus(id: string, status: string): Promise<AlertItem> {
  return reviewAlert(id, { status });
}

export const api = {
  getHealth: fetchHealth,
  getDemoSamples: fetchDemoSamples,
  getSamples: fetchDemoSamples,
  resetDemo: resetDemoEnvironment,
  analyzeEmail: analyzeEmail,
  analyze: analyzeEmail,
  getAnalyses: fetchAnalyses,
  getAnalysisById: fetchAnalysisById,
  getCases: fetchCases,
  getCaseById: fetchCaseById,
  createCase: createCase,
  updateCase: updateCase,
  addCaseNote: addCaseNote,
  getAlerts: fetchAlerts,
  reviewAlert: reviewAlert,
  updateAlertStatus: updateAlertStatus,
  getEvidence: fetchEvidence,
  createEvidence: createEvidence,
  registerEvidence: createEvidence,
  getReports: fetchReports,
  getReportById: fetchReportById,
  generateReport: generateReport,
  lookupThreatIntel: lookupThreatIntel,
  searchIntel: lookupThreatIntel,
  getGraphData: fetchGraphData,
};
