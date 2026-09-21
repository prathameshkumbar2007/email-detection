import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Download, Printer, Copy, Check, 
  ExternalLink, Eye, Shield, AlertTriangle, Clock, X
} from 'lucide-react';
import { api } from '../services/api';
import { ForensicReport } from '../types';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ForensicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<ForensicReport | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.getReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyMarkdown = (report: ForensicReport) => {
    const md = `# ${report.title}
Report ID: ${report.id}
Generated: ${report.generated_at}
Investigator: ${report.created_by}
Status: ${report.status}

## Executive Summary
${report.summary}

## 1. Observed Technical Facts
${report.report_data.observed_facts.map(f => `- ${f}`).join('\n')}

## 2. Automated Engine Findings
${report.report_data.automated_findings.map(f => `- ${f}`).join('\n')}

## 3. Forensic Interpretations & Hypotheses
${report.report_data.interpretations.map(f => `- ${f}`).join('\n')}

## 4. Unavailable Evidence & Gaps
${report.report_data.unavailable_evidence.map(f => `- ${f}`).join('\n')}

## 5. Limitations & Caveats
${report.report_data.limitations}
`;
    navigator.clipboard.writeText(md);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Forensic Intelligence Reports Catalog
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Structured forensic documentation with explicit demarcation between observed facts, automated findings, and hypotheses.
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-sm">
            Loading forensic reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-sm">
            No reports generated yet.
          </div>
        ) : (
          reports.map((rep) => (
            <div
              key={rep.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    {rep.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    rep.status === 'Finalized' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}>
                    {rep.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 leading-snug">
                  {rep.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {rep.summary}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-500 font-mono">
                  {rep.generated_at.split('T')[0]} • {rep.created_by}
                </div>

                <button
                  onClick={() => setActiveReport(rep)}
                  className="px-3 py-1.5 bg-cyan-600/80 hover:bg-cyan-600 text-white rounded font-semibold transition-colors flex items-center space-x-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Printable Report Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Actions Bar */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-slate-300">
                  {activeReport.id} — Digital Forensics Incident Report
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyMarkdown(activeReport)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded transition-colors"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied' : 'Copy MD'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-xs text-white rounded font-semibold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dossier</span>
                </button>
                <button
                  onClick={() => setActiveReport(null)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Scroll Content */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-200 font-sans printable-report">
              {/* Report Header */}
              <div className="border-b border-slate-800 pb-5">
                <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold mb-1">
                  CYBERTRACE AI FORENSIC LABORATORY
                </div>
                <h1 className="text-2xl font-bold text-slate-100">
                  {activeReport.title}
                </h1>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Report ID:</span>
                    <span className="text-cyan-300">{activeReport.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date Generated:</span>
                    <span className="text-slate-200">{activeReport.generated_at}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Examiner:</span>
                    <span className="text-slate-200">{activeReport.created_by}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Classification:</span>
                    <span className="text-emerald-400">{activeReport.status}</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-l-2 border-cyan-400 pl-2">
                  Executive Summary
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                  {activeReport.summary}
                </p>
              </div>

              {/* Section 1: Observed Technical Facts */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-l-2 border-blue-400 pl-2">
                  1. Observed Technical Facts (Direct Evidence)
                </h2>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                  {activeReport.report_data.observed_facts.map((fact, i) => (
                    <li key={i} className="leading-relaxed">{fact}</li>
                  ))}
                </ul>
              </div>

              {/* Section 2: Automated Engine Findings */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-l-2 border-amber-400 pl-2">
                  2. Automated Engine Findings
                </h2>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                  {activeReport.report_data.automated_findings.map((finding, i) => (
                    <li key={i} className="leading-relaxed">{finding}</li>
                  ))}
                </ul>
              </div>

              {/* Section 3: Forensic Interpretations */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-l-2 border-purple-400 pl-2">
                  3. Forensic Interpretations & Attribution Hypotheses
                </h2>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                  {activeReport.report_data.interpretations.map((hyp, i) => (
                    <li key={i} className="leading-relaxed">{hyp}</li>
                  ))}
                </ul>
              </div>

              {/* Section 4: Unavailable Evidence */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-l-2 border-red-400 pl-2">
                  4. Unavailable Evidence & Investigative Gaps
                </h2>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                  {activeReport.report_data.unavailable_evidence.map((gap, i) => (
                    <li key={i} className="leading-relaxed">{gap}</li>
                  ))}
                </ul>
              </div>

              {/* Section 5: Mandatory Caveat & Standards Disclaimer */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200 leading-relaxed">
                <div className="font-bold flex items-center space-x-1.5 mb-1 text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>SCIENTIFIC LIMITATIONS & STANDARDS NOTICE</span>
                </div>
                {activeReport.report_data.limitations}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
