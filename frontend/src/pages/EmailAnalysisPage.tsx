import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { analyzeEmail } from '../services/api';
import { RawEmailEditor } from '../components/analysis/RawEmailEditor';
import { FindingCard } from '../components/analysis/FindingCard';
import { HeaderTable } from '../components/analysis/HeaderTable';
import { RelayTimeline } from '../components/analysis/RelayTimeline';
import { AnalysisProgress } from '../components/analysis/AnalysisProgress';
import { ScoreGauge } from '../components/shared/ScoreGauge';
import { RiskBadge } from '../components/shared/RiskBadge';
import {
  UploadCloud,
  FileCode,
  SlidersHorizontal,
  Play,
  FileText,
  AlertCircle,
  ShieldAlert,
  Link2,
  Lock,
  Binary,
  Hash,
  Download,
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const EmailAnalysisPage: React.FC = () => {
  const { samples, activeAnalysis, setActiveAnalysis, addToast, setCurrentPage } = useDemo();

  const [inputTab, setInputTab] = useState<'upload' | 'raw' | 'metadata'>('raw');
  const [rawEml, setRawEml] = useState<string>(samples[0]?.raw_eml || '');
  const [filename, setFilename] = useState<string>('sample_wire_transfer.eml');
  const [resultTab, setResultTab] = useState<'summary' | 'headers' | 'urls' | 'auth' | 'indicators' | 'evidence'>('summary');
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  // Manual metadata state
  const [metaFrom, setMetaFrom] = useState('marcus.vance@vance-holdings.com');
  const [metaTo, setMetaTo] = useState('sjenkins@vance-holdings.com');
  const [metaSubject, setMetaSubject] = useState('URGENT: Escrow Payment Authorization');
  const [metaReplyTo, setMetaReplyTo] = useState('marcus.vance.exec@mail-consulting.ru');
  const [metaReturnPath, setMetaReturnPath] = useState('bounce@bulletproof-vps.ru');
  const [metaMsgId, setMetaMsgId] = useState('<20260921-manual@vance-holdings.com>');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        message: 'Maximum allowed RFC 5322 payload is 15MB.'
      });
      return;
    }
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      setRawEml(content);
      setInputTab('raw');
      addToast({
        type: 'info',
        title: 'EML Loaded',
        message: `Imported ${file.name} (${file.size} bytes)`
      });
    };
    reader.readAsText(file);
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      let payload: any = { filename };
      if (inputTab === 'metadata') {
        payload = {
          filename: 'metadata_ingest.eml',
          from_addr: metaFrom,
          to_addr: metaTo,
          subject: metaSubject,
          reply_to: metaReplyTo,
          return_path: metaReturnPath,
          message_id: metaMsgId,
        };
      } else {
        if (!rawEml.trim()) {
          addToast({
            type: 'warning',
            title: 'Empty Payload',
            message: 'Please paste email RFC headers or select a demo sample.'
          });
          setAnalyzing(false);
          return;
        }
        payload = { eml_text: rawEml, filename };
      }

      const res = await analyzeEmail(payload);
      setActiveAnalysis(res);
      addToast({
        type: 'success',
        title: 'Analysis Complete',
        message: `${res.threat_classification} (Risk Score: ${res.risk_score}/100)`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Analysis Failed',
        message: err.message
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const loadPresetSample = (sampleId: string) => {
    const s = samples.find(x => x.id === sampleId);
    if (!s) return;
    setRawEml(s.raw_eml);
    setFilename(`${s.id}.eml`);
    setInputTab('raw');
    addToast({
      type: 'info',
      title: 'Scenario Loaded',
      message: `Populated ${s.name}`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 font-mono">
            AI Email Threat Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deep RFC 5322 header parsing, cryptographic authentication verification, and behavioral risk scoring.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 uppercase hidden sm:inline">Scenario:</span>
          <select
            onChange={e => loadPresetSample(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            defaultValue=""
          >
            <option value="" disabled>Load Demo Threat Scenario...</option>
            {samples.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Split Layout: Left Input Workspace / Right Analysis Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Input Workspace (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-5 shadow-xl space-y-4">
            {/* Input Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setInputTab('raw')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    inputTab === 'raw'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>Raw Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab('upload')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    inputTab === 'upload'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload .EML</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab('metadata')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    inputTab === 'metadata'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Metadata</span>
                </button>
              </div>

              <span className="text-[10px] font-mono text-slate-500 uppercase">Input</span>
            </div>

            {/* Tab 1: Upload .EML */}
            {inputTab === 'upload' && (
              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-8 hover:border-sky-500/50 hover:bg-slate-950/40 transition-all cursor-pointer group">
                  <UploadCloud className="h-10 w-10 text-slate-500 group-hover:text-sky-400 transition-colors mb-2" />
                  <span className="text-xs font-bold text-slate-200">
                    Click to browse or drop .EML file
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Accepts RFC 5322 MIME messages up to 15MB
                  </span>
                  <input
                    type="file"
                    accept=".eml,.txt,.msg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-[11px] text-slate-400 flex items-start gap-2">
                  <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Privacy & Sandbox Notice:</strong> Telemetry is parsed locally within the isolated demonstration sandbox. No raw message bodies are transmitted externally.
                  </span>
                </div>
              </div>
            )}

            {/* Tab 2: Raw Email Editor */}
            {inputTab === 'raw' && (
              <RawEmailEditor
                value={rawEml}
                onChange={setRawEml}
                onClear={() => setRawEml('')}
              />
            )}

            {/* Tab 3: Manual Metadata */}
            {inputTab === 'metadata' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">From: Header</label>
                  <input
                    type="text"
                    value={metaFrom}
                    onChange={e => setMetaFrom(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">To: Recipient</label>
                  <input
                    type="text"
                    value={metaTo}
                    onChange={e => setMetaTo(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Subject</label>
                  <input
                    type="text"
                    value={metaSubject}
                    onChange={e => setMetaSubject(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Reply-To (Optional)</label>
                    <input
                      type="text"
                      value={metaReplyTo}
                      onChange={e => setMetaReplyTo(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Return-Path</label>
                    <input
                      type="text"
                      value={metaReturnPath}
                      onChange={e => setMetaReturnPath(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all disabled:opacity-50 uppercase tracking-wider font-mono"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{analyzing ? 'Executing Pipeline...' : 'Analyze Email'}</span>
              </button>
            </div>
          </div>

          {/* Stepper Progress */}
          {analyzing && <AnalysisProgress />}
        </div>

        {/* RIGHT PANEL: Analysis Results (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          {!activeAnalysis ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center backdrop-blur-sm space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-200 font-mono">
                No Active Analysis Loaded
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Paste RFC 5322 headers on the left workspace or choose one of the pre-packaged demo scenarios to initiate full threat assessment.
              </p>
              <button
                onClick={() => loadPresetSample('bec_wire_transfer')}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500/10 border border-sky-500/30 px-3.5 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500/20 transition-colors mt-2"
              >
                Load Sample: Executive BEC Fraud
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* TOP: Risk Assessment Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <RiskBadge status={activeAnalysis.threat_classification} size="lg" />
                    <span className="text-xs font-mono text-slate-400 border border-slate-800 bg-slate-950 px-2.5 py-1 rounded">
                      ID: {activeAnalysis.id}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Demo Telemetry
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 leading-snug">
                    {activeAnalysis.subject}
                  </h3>

                  <div className="text-xs text-slate-400 space-y-0.5">
                    <div>From: <span className="font-mono text-slate-300">{activeAnalysis.sender}</span></div>
                    <div>To: <span className="font-mono text-slate-300">{activeAnalysis.recipient}</span></div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setCurrentPage('header-forensics')}
                      className="text-xs font-mono text-sky-400 hover:underline flex items-center gap-1"
                    >
                      Inspect Headers & Relay →
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      onClick={() => setCurrentPage('cases')}
                      className="text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      Escalate to Case →
                    </button>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center">
                  <ScoreGauge
                    score={activeAnalysis.risk_score}
                    classification={activeAnalysis.threat_classification}
                    confidence={activeAnalysis.confidence_level}
                  />
                </div>
              </div>

              {/* RESULT TABS */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md shadow-xl space-y-4">
                <div className="flex items-center gap-1 border-b border-slate-800 pb-3 overflow-x-auto">
                  {[
                    { id: 'summary', label: 'Summary', count: activeAnalysis.findings.length },
                    { id: 'headers', label: 'Header Analysis', count: activeAnalysis.relay_hops.length },
                    { id: 'urls', label: 'URLs', count: activeAnalysis.urls?.length || 0 },
                    { id: 'auth', label: 'Authentication' },
                    { id: 'indicators', label: 'Indicators' },
                    { id: 'evidence', label: 'Evidence Vault' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setResultTab(tab.id as any)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                        resultTab === tab.id
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab 1: Summary */}
                {resultTab === 'summary' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
                          Key Detection Findings ({activeAnalysis.findings.length})
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">Click to expand technical rationale</span>
                      </div>
                      {activeAnalysis.findings.map(finding => (
                        <FindingCard key={finding.id} finding={finding} />
                      ))}
                    </div>

                    {/* Recommended Actions */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
                      <span className="text-xs font-mono uppercase font-bold text-slate-300 tracking-wider block">
                        Recommended SOC Actions
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {activeAnalysis.recommended_actions.map(act => (
                          <div key={act.action} className="rounded-lg bg-slate-900 border border-slate-800 p-2.5 space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                              <span>{act.action}</span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                act.priority === 'High' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {act.priority}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-snug">{act.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Limitations Caveat */}
                    <div className="rounded-xl bg-slate-950/50 border border-slate-800/80 p-3 text-[11px] text-slate-400 flex items-start gap-2">
                      <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Evidentiary Limitation:</strong> {activeAnalysis.limitations}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Header Analysis */}
                {resultTab === 'headers' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <RelayTimeline hops={activeAnalysis.relay_hops} />
                    <HeaderTable hops={activeAnalysis.relay_hops} />
                  </div>
                )}

                {/* Tab 3: URLs */}
                {resultTab === 'urls' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <span className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
                      Extracted Hyperlinks ({activeAnalysis.urls?.length || 0})
                    </span>
                    {(!activeAnalysis.urls || activeAnalysis.urls.length === 0) ? (
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500 font-mono">
                        Zero hyperlinks extracted from email body.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activeAnalysis.urls.map((u, i) => (
                          <div key={i} className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <Link2 className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                                <span className="font-mono text-xs font-bold text-slate-200 truncate">
                                  {u.url}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 truncate">
                                Anchor Text: <span className="text-slate-300">"{u.anchor_text}"</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <RiskBadge status={u.risk || 'Suspicious'} size="sm" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 4: Authentication */}
                {resultTab === 'auth' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-slate-300">SPF PROTOCOL</span>
                          <RiskBadge status={activeAnalysis.auth?.spf?.status || 'None'} size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Domain: <span className="font-mono text-slate-200">{activeAnalysis.auth?.spf?.domain || 'N/A'}</span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-slate-300">DKIM SIGNATURE</span>
                          <RiskBadge status={activeAnalysis.auth?.dkim?.status || 'None'} size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Selector: <span className="font-mono text-slate-200">{activeAnalysis.auth?.dkim?.selector || 'None'}</span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-slate-300">DMARC POLICY</span>
                          <RiskBadge status={activeAnalysis.auth?.dmarc?.status || 'None'} size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Action: <span className="font-mono text-slate-200">{activeAnalysis.auth?.dmarc?.policy || 'none'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 font-mono text-xs">
                      <span className="text-slate-400 text-[11px] uppercase tracking-wider block">Raw Authentication-Results Header</span>
                      <div className="rounded bg-slate-900 border border-slate-800 p-2.5 text-slate-300 text-[11px] break-words">
                        {activeAnalysis.parsed?.raw_headers_list?.find(h => h.name.toLowerCase() === 'authentication-results')?.value || 'Authentication-Results header absent'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 5: Indicators */}
                {resultTab === 'indicators' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <span className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
                      Extracted Network & Identity IOCs
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <span className="text-slate-500 text-[10px] block">ORIGINATING IP</span>
                        <span className="text-slate-200 font-bold">{activeAnalysis.origin_node?.ip || 'Unresolved'}</span>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <span className="text-slate-500 text-[10px] block">SENDER DOMAIN</span>
                        <span className="text-slate-200 font-bold">{activeAnalysis.parsed?.from?.domain || 'N/A'}</span>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <span className="text-slate-500 text-[10px] block">REPLY-TO REDIRECTION</span>
                        <span className="text-slate-200 font-bold">{activeAnalysis.parsed?.reply_to?.email || 'Same as sender'}</span>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <span className="text-slate-500 text-[10px] block">AUTONOMOUS SYSTEM</span>
                        <span className="text-slate-200 font-bold">{activeAnalysis.origin_node?.geo?.asn || 'AS204655'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 6: Evidence */}
                {resultTab === 'evidence' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 font-mono text-xs">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Cryptographic Evidence Hashes
                      </span>
                      <div className="space-y-1.5 text-[11px]">
                        <div><strong className="text-slate-500">SHA-256:</strong> <span className="text-sky-300 break-all">{activeAnalysis.evidence?.hashes?.sha256}</span></div>
                        <div><strong className="text-slate-500">SHA-1:</strong> <span className="text-slate-300 break-all">{activeAnalysis.evidence?.hashes?.sha1}</span></div>
                        <div><strong className="text-slate-500">MD5:</strong> <span className="text-slate-300">{activeAnalysis.evidence?.hashes?.md5}</span></div>
                        <div><strong className="text-slate-500">FILE SIZE:</strong> <span className="text-slate-300">{activeAnalysis.evidence?.hashes?.size_bytes} bytes</span></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const blob = new Blob([activeAnalysis.parsed?.raw_text || rawEml], { type: 'message/rfc822' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = activeAnalysis.filename || 'evidence.eml';
                          a.click();
                        }}
                        className="flex items-center gap-2 rounded-xl bg-sky-500/10 border border-sky-500/30 px-4 py-2 text-xs font-bold text-sky-400 hover:bg-sky-500/20 transition-all font-mono"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download RFC 5322 EML Artifact</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
