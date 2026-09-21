import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Filter, Search, Clock, User, 
  CheckCircle, AlertTriangle, FileText, ChevronRight, 
  X, Send, Shield, Hash, Paperclip
} from 'lucide-react';
import { api } from '../services/api';
import { CaseItem } from '../types';

export const CasesPage: React.FC = () => {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Drawers
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await api.createCase({
        title: newTitle,
        description: newDescription,
        priority: newPriority,
        assigned_analyst: 'Tier-2 Forensic Lead',
      });
      setCases([created, ...cases]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
    } catch (err) {
      console.error('Failed to create case:', err);
    }
  };

  const handleAddNote = async (caseId: string) => {
    if (!noteText.trim() || !selectedCase) return;
    try {
      const updated = await api.addCaseNote(caseId, noteText, 'SOC Lead Analyst');
      setSelectedCase(updated);
      setCases(cases.map(c => c.id === updated.id ? updated : c));
      setNoteText('');
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const filteredCases = cases.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase()) && !c.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Open': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'Under Investigation': return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'Evidence Review': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Resolved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Briefcase className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Incident Case Management
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Track forensic investigations, maintain evidentiary chain-of-custody, and document collaborative analyst findings.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New Incident Case</span>
        </button>
      </div>

      {/* Case Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase">Active Cases</div>
          <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">
            {cases.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase">Critical Priority</div>
          <div className="text-2xl font-bold text-red-400 mt-1 font-mono">
            {cases.filter(c => c.priority === 'Critical').length}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase">Under Review</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
            {cases.filter(c => c.status === 'Evidence Review').length}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase">Resolved</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            {cases.filter(c => c.status === 'Resolved').length}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cases by ID or title..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Evidence Review">Evidence Review</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Cases Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading incident cases...</div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No cases match the selected filter criteria.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className="p-4 hover:bg-slate-800/60 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {c.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(c.priority)}`}>
                      {c.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-100">
                    {c.title}
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-1">
                    {c.description}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs text-slate-400 sm:text-right shrink-0">
                  <div>
                    <div className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{c.assigned_analyst}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      Updated: {c.updated_at.split('T')[0]}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Case Details Drawer Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-cyan-400">{selectedCase.id}</span>
                <h2 className="text-lg font-bold text-slate-100 mt-0.5">{selectedCase.title}</h2>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Case Meta Bar */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Priority</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${getPriorityBadge(selectedCase.priority)}`}>
                  {selectedCase.priority}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Status</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${getStatusBadge(selectedCase.status)}`}>
                  {selectedCase.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Lead Analyst</span>
                <span className="font-semibold text-slate-200 block mt-1">{selectedCase.assigned_analyst}</span>
              </div>
            </div>

            {/* Case Description */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Incident Summary</h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                {selectedCase.description}
              </p>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Forensic Audit Timeline</h3>
              <div className="space-y-2">
                {selectedCase.timeline.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs bg-slate-950 p-2.5 rounded border border-slate-800/80">
                    <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono text-slate-400 text-[11px] block">{item.time}</span>
                      <span className="text-slate-200 font-medium">{item.event}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Analyst Case Notes</h3>
              <div className="space-y-2">
                {selectedCase.notes.map((note) => (
                  <div key={note.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-cyan-300">{note.author}</span>
                      <span className="text-slate-500 font-mono">{note.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300">{note.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Note Input */}
              <div className="flex space-x-2 pt-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add collaborative forensic note..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  onClick={() => handleAddNote(selectedCase.id)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100">Create Forensic Incident Case</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Case Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Investigation: Executive Wire Transfer Impersonation"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Case Description & Findings</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                  placeholder="Detail the forensic trigger, observed anomalies, and preliminary hypotheses..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
                >
                  Initialize Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
