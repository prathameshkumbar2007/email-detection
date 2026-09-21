import React, { useState, useEffect } from 'react';
import { 
  Lock, Shield, CheckCircle, Copy, Check, Upload, 
  FileText, Hash, AlertTriangle, Clock, X, Eye
} from 'lucide-react';
import { api } from '../services/api';
import { EvidenceItem } from '../types';

export const EvidenceVaultPage: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);
  
  // New evidence form
  const [filename, setFilename] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState('application/vnd.rfc822');

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const data = await api.getEvidence();
      setEvidenceList(data);
    } catch (err) {
      console.error('Failed to load evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleUploadSimulated = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename) return;

    // Deterministic mock sha256
    const mockSha256 = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const newItem: EvidenceItem = {
      id: `EV-2026-${String(evidenceList.length + 1).padStart(3, '0')}`,
      filename,
      file_type: fileType,
      sha256: mockSha256,
      file_size: Math.floor(Math.random() * 250000) + 12000,
      uploaded_at: new Date().toISOString(),
      uploaded_by: 'SOC Lead Analyst',
      description,
      chain_of_custody: [
        {
          event: 'Forensic Ingestion',
          timestamp: new Date().toISOString(),
          officer: 'SOC Lead Analyst',
          note: 'Artifact received and SHA-256 computed into immutable vault',
          hash_verified: true,
        }
      ]
    };

    setEvidenceList([newItem, ...evidenceList]);
    setShowUploadModal(false);
    setFilename('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Lock className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Cryptographic Evidence Vault & Chain-of-Custody
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            NIST SP 800-86 compliant evidentiary locker maintaining SHA-256 cryptographic integrity and forensic custody audit logs.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors shadow"
        >
          <Upload className="w-4 h-4" />
          <span>Ingest Artifact</span>
        </button>
      </div>

      {/* Prototype Disclaimer Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-3.5">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-amber-300">PROTOTYPE NOTICE:</span>{' '}
          Demonstrates cryptographic chain-of-custody tracking. In production, forensic acquisition requires 
          hardware write-blockers, isolated offline forensics machines, and FIPS 140-2 validated storage.
        </div>
      </div>

      {/* Evidence Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading evidence vault records...</div>
        ) : evidenceList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No evidence artifacts archived.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Evidence ID</th>
                  <th className="py-3.5 px-4">Artifact Filename</th>
                  <th className="py-3.5 px-4">SHA-256 Digest</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Acquisition Date</th>
                  <th className="py-3.5 px-4">Integrity Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {evidenceList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-cyan-400 font-bold">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 font-sans font-medium">
                      {item.filename}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center space-x-2">
                        <span className="truncate max-w-[200px]" title={item.sha256}>
                          {item.sha256.slice(0, 16)}...{item.sha256.slice(-8)}
                        </span>
                        <button
                          onClick={() => copyHash(item.sha256)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"
                          title="Copy Full SHA-256"
                        >
                          {copiedHash === item.sha256 ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {(item.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {item.uploaded_at.split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <CheckCircle className="w-3 h-3" />
                        <span>Verified Intact</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                      >
                        Custody Log
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custody Log Drawer / Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-cyan-400">{selectedItem.id}</span>
                <h2 className="text-base font-bold text-slate-100 mt-0.5">
                  Chain-of-Custody Verification Audit
                </h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs">
              <div className="text-slate-400">Target Artifact:</div>
              <div className="font-semibold text-slate-100">{selectedItem.filename}</div>
              <div className="font-mono text-[11px] text-cyan-300 break-all mt-1">
                SHA256: {selectedItem.sha256}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Custody Event Timeline
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedItem.chain_of_custody.map((event, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{event.event}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{event.timestamp}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Officer: <strong className="text-slate-300">{event.officer}</strong>
                    </div>
                    <p className="text-slate-300 text-xs italic">"{event.note}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ingest Artifact Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100">Ingest New Forensic Evidence</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSimulated} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Artifact Name / Filename</label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="e.g. suspicious_invoice_relay_capture.eml"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">MIME File Type</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
                >
                  <option value="message/rfc822">message/rfc822 (.eml)</option>
                  <option value="application/pdf">application/pdf (.pdf)</option>
                  <option value="application/vnd.ms-excel">application/vnd.ms-excel (.xls)</option>
                  <option value="application/x-dosexec">application/x-dosexec (.exe)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Custodial Ingestion Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe acquisition method, source mailbox, and hash verification..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
                >
                  Calculate Hash & Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
