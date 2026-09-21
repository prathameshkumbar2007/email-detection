import React, { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, Shield, CheckCircle, Clock, 
  Search, Filter, ChevronRight, X, ArrowUpRight, Check
} from 'lucide-react';
import { api } from '../services/api';
import { AlertItem } from '../types';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (alertId: string, newStatus: string) => {
    try {
      const updated = await api.updateAlertStatus(alertId, newStatus);
      setAlerts(alerts.map(a => a.id === updated.id ? updated : a));
      if (selectedAlert?.id === updated.id) {
        setSelectedAlert(updated);
      }
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && !a.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getSeverityBadge = (s: string) => {
    switch (s) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Active': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'Under Review': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Escalated': return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'Dismissed': return 'bg-slate-700 text-slate-400 border-slate-600';
      default: return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Real-Time Security Alert Triage
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Automated detection queue prioritizing high-confidence email threats, spoofing indicators, and payload detonations.
          </p>
        </div>

        {/* Status Counter Chips */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg">
            {alerts.filter(a => a.severity === 'Critical' && a.status === 'Active').length} Active Critical
          </span>
          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg">
            {alerts.filter(a => a.status === 'Under Review').length} In Review
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 shadow-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts by title or alert ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Under Review">Under Review</option>
          <option value="Escalated">Escalated</option>
          <option value="Dismissed">Dismissed</option>
        </select>
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading security alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No alerts match the criteria.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className="p-4 hover:bg-slate-800/60 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {alert.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(alert.status)}`}>
                      {alert.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Type: {alert.alert_type}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-100">
                    {alert.title}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center space-x-3">
                    <span>Subject: <strong className="text-slate-300">{alert.related_email_subject}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">From: {alert.sender}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400 shrink-0">
                  <div className="text-right">
                    <div>{alert.assigned_analyst}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{alert.created_at.split('T')[0]}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-cyan-400">{selectedAlert.id}</span>
                <h2 className="text-base font-bold text-slate-100 mt-0.5">{selectedAlert.title}</h2>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Severity</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${getSeverityBadge(selectedAlert.severity)}`}>
                  {selectedAlert.severity}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Status</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${getStatusBadge(selectedAlert.status)}`}>
                  {selectedAlert.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Threat Type</span>
                <span className="font-mono text-slate-200 block mt-1">{selectedAlert.alert_type}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Assigned Analyst</span>
                <span className="font-semibold text-slate-200 block mt-1">{selectedAlert.assigned_analyst}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-slate-400">Target Email Subject:</div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800 font-semibold text-slate-200">
                {selectedAlert.related_email_subject}
              </div>

              <div className="text-slate-400">Sender Identity:</div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800 font-mono text-cyan-300">
                {selectedAlert.sender}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => handleUpdateStatus(selectedAlert.id, 'Under Review')}
                className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Set Under Review
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedAlert.id, 'Escalated')}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Escalate to Tier-3
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedAlert.id, 'Dismissed')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Dismiss False Positive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
