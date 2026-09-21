import React, { useState, useEffect } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  Search,
  FolderSearch,
  MailCheck,
  Globe2,
  Lock,
  AlertOctagon,
  FileText,
  X,
  ArrowRight
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { setCurrentPage, loadSampleScenario, samples } = useDemo();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickItems = [
    { type: 'Case', id: 'CASE-2026-0842', title: 'Executive BEC Wire Transfer ($78,500)', page: 'cases', icon: FolderSearch },
    { type: 'Case', id: 'CASE-2026-0843', title: 'M365 Tenant Credential Harvester', page: 'cases', icon: FolderSearch },
    { type: 'Alert', id: 'ALERT-9021', title: 'CEO BEC Wire Transfer Lure', page: 'alerts', icon: AlertOctagon },
    { type: 'Evidence', id: 'EVD-2026-001', title: 'executive_bec_wire_transfer.eml', page: 'evidence', icon: Lock },
    { type: 'IP', id: '185.220.101.5', title: 'Moscow Bulletproof VPS Relay', page: 'geolocation', icon: Globe2 },
    { type: 'Domain', id: 'micros0ft-login.com', title: 'Punycode Homoglyph Phishing Domain', page: 'threat-intel', icon: Search },
    { type: 'Report', id: 'RPT-2026-001', title: 'Executive BEC Incident Response Report', page: 'reports', icon: FileText },
  ];

  const filtered = query.trim() === ''
    ? quickItems
    : quickItems.filter(i =>
        i.id.toLowerCase().includes(query.toLowerCase()) ||
        i.title.toLowerCase().includes(query.toLowerCase()) ||
        i.type.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3.5 bg-slate-950/80">
          <Search className="h-5 w-5 text-sky-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Case ID, IP, Domain, Hash, or Alert..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
            {query.trim() ? `Search Results (${filtered.length})` : 'Recent Security Artifacts & IOCs'}
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching intelligence items found for "{query}".
            </div>
          ) : (
            filtered.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.page);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-slate-800/80 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sky-400 group-hover:bg-sky-500/20 group-hover:text-sky-300 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200">{item.id}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono uppercase">
                          {item.type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 truncate mt-0.5">{item.title}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-sky-400 transition-colors" />
                </button>
              );
            })
          )}

          {/* Quick Scenario Launchers */}
          <div className="pt-3 mt-3 border-t border-slate-800/80">
            <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
              1-Click Demo Email Scenarios
            </div>
            {samples.slice(0, 3).map(s => (
              <button
                key={s.id}
                onClick={async () => {
                  setCurrentPage('email-analysis');
                  onClose();
                  await loadSampleScenario(s.id);
                }}
                className="flex w-full items-center justify-between rounded-xl p-2.5 text-left hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MailCheck className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="text-xs text-slate-300 truncate font-medium">{s.name}</span>
                </div>
                <span className="text-[10px] text-sky-400 font-mono">Load & Analyze →</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
          <span>Navigate with mouse or Tab</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
