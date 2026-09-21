import React, { useState, useEffect } from 'react';
import { useDemo } from '../context/DemoContext';
import { fetchAnalyses, fetchCases, fetchAlerts } from '../services/api';
import { MetricCard } from '../components/shared/MetricCard';
import { RiskBadge } from '../components/shared/RiskBadge';
import {
  Mail,
  ShieldAlert,
  FolderSearch,
  AlertOctagon,
  Globe2,
  FileCheck,
  Plus,
  FileDown,
  ArrowUpRight,
  TrendingUp,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { setCurrentPage, loadSampleScenario } = useDemo();

  const [analyses, setAnalyses] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [a, c, al] = await Promise.all([
        fetchAnalyses(),
        fetchCases(),
        fetchAlerts()
      ]);
      setAnalyses(a);
      setCases(c);
      setAlerts(al);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 font-mono">
            Security Intelligence Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor email threats, investigate suspicious infrastructure, and manage forensic cases.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentPage('email-analysis')}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 px-3.5 py-2 text-xs font-bold text-slate-950 transition-all font-mono shadow-md shadow-sky-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Analyze Email</span>
          </button>
          <button
            onClick={() => setCurrentPage('cases')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-850 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <FolderSearch className="h-4 w-4 text-indigo-400" />
            <span>Create Case</span>
          </button>
          <button
            onClick={() => setCurrentPage('reports')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-850 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <FileDown className="h-4 w-4 text-slate-400" />
            <span>Export Overview</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <MetricCard
          title="Emails Analyzed"
          value="1,284"
          icon={Mail}
          description="Inbound telemetry analyzed"
          trend={{ value: "+14%", isPositive: true }}
          tooltipText="Total RFC 5322 MIME messages processed by border gateway in the last 24 hours."
          badgeColor="text-sky-400 bg-sky-500/10 border-sky-500/20"
        />
        <MetricCard
          title="High-Risk Emails"
          value="186"
          icon={ShieldAlert}
          description="Risk score >= 60/100"
          trend={{ value: "+8%", isPositive: false }}
          tooltipText="Messages exceeding severity thresholds for BEC, credential phishing or weaponized payloads."
          badgeColor="text-rose-400 bg-rose-500/10 border-rose-500/20"
        />
        <MetricCard
          title="Open Cases"
          value={cases.length.toString()}
          icon={FolderSearch}
          description="Active investigations"
          trend={{ value: "2 Critical", isPositive: false }}
          tooltipText="Forensic incident investigations currently open or under evidence review."
          badgeColor="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
        />
        <MetricCard
          title="Active Alerts"
          value={alerts.length.toString()}
          icon={AlertOctagon}
          description="Awaiting SOC triage"
          trend={{ value: "4 Unreviewed", isPositive: false }}
          tooltipText="Real-time alerts triggered by threat rules and heuristic detectors."
          badgeColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
        />
        <MetricCard
          title="Suspicious Domains"
          value="29"
          icon={Globe2}
          description="Combosquats & Punycode"
          trend={{ value: "+3 Today", isPositive: false }}
          tooltipText="Identified lookalike or typosquatted domains targeting corporate brands."
          badgeColor="text-purple-400 bg-purple-500/10 border-purple-500/20"
        />
        <MetricCard
          title="Auth Failures"
          value="74"
          icon={FileCheck}
          description="SPF / DKIM / DMARC"
          trend={{ value: "5.7% Ratio", isPositive: true }}
          tooltipText="Incoming emails failing cryptographic sender policy alignment."
          badgeColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart A: Threat Classification Distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Threat Classification Distribution
              </h3>
              <p className="text-[11px] text-slate-400">Classified message proportions</p>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Demo Data</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Legitimate Corporate', pct: 72, count: 924, color: 'bg-emerald-500' },
              { label: 'Phishing (Credentials)', pct: 14, count: 180, color: 'bg-rose-500' },
              { label: 'Executive Impersonation (BEC)', pct: 7, count: 90, color: 'bg-amber-500' },
              { label: 'Financial Fraud & Invoices', pct: 5, count: 64, color: 'bg-purple-500' },
              { label: 'Suspicious Relay / Anomaly', pct: 2, count: 26, color: 'bg-sky-500' },
            ].map(item => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.label}</span>
                  <span className="font-mono text-slate-400 text-[11px]">{item.count} ({item.pct}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart B: Threat Activity Timeline (7-Day Trend) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Threat Activity Timeline (7 Days)
              </h3>
              <p className="text-[11px] text-slate-400">Daily message triage & high-risk volume</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" /> Total Ingest</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" /> High-Risk</span>
            </div>
          </div>

          {/* SVG 7-Day Histogram */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2">
            {[
              { day: 'Mon', total: 110, risk: 18 },
              { day: 'Tue', total: 140, risk: 24 },
              { day: 'Wed', total: 165, risk: 32 },
              { day: 'Thu', total: 190, risk: 28 },
              { day: 'Fri', total: 210, risk: 42 },
              { day: 'Sat', total: 95, risk: 14 },
              { day: 'Sun', total: 130, risk: 28 },
            ].map(d => {
              const maxVal = 220;
              const totalHeight = (d.total / maxVal) * 100;
              const riskHeight = (d.risk / maxVal) * 100;

              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="relative w-full max-w-[28px] flex items-end justify-center h-full">
                    {/* Background bar */}
                    <div
                      className="w-full rounded-t bg-sky-500/20 group-hover:bg-sky-500/30 transition-all"
                      style={{ height: `${totalHeight}%` }}
                    />
                    {/* Risk overlay bar */}
                    <div
                      className="absolute bottom-0 w-full rounded-t bg-rose-500/80 group-hover:bg-rose-500 transition-all"
                      style={{ height: `${riskHeight}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tables: Recent Alerts & Recent Analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Alerts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-rose-400" />
              Recent Security Alerts
            </h3>
            <button
              onClick={() => setCurrentPage('alerts')}
              className="text-[11px] font-mono text-sky-400 hover:underline flex items-center gap-1"
            >
              All Alerts →
            </button>
          </div>

          <div className="divide-y divide-slate-800/60 flex-1 overflow-y-auto max-h-80">
            {alerts.slice(0, 4).map(alert => (
              <div
                key={alert.id}
                onClick={() => setCurrentPage('alerts')}
                className="py-3 flex items-start justify-between gap-3 hover:bg-slate-850/50 p-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <RiskBadge status={alert.severity} size="sm" />
                    <span className="font-mono text-xs font-bold text-slate-200 truncate">
                      {alert.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {alert.alert_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium truncate mt-1">
                    {alert.title}
                  </p>
                  <span className="text-[11px] text-slate-500 truncate mt-0.5">
                    Sender: {alert.sender}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Email Analyses */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
              <Mail className="h-4 w-4 text-sky-400" />
              Recent Email Analyses
            </h3>
            <button
              onClick={() => setCurrentPage('email-analysis')}
              className="text-[11px] font-mono text-sky-400 hover:underline flex items-center gap-1"
            >
              Analyze New →
            </button>
          </div>

          <div className="divide-y divide-slate-800/60 flex-1 overflow-y-auto max-h-80">
            {analyses.slice(0, 4).map(analysis => (
              <div
                key={analysis.id}
                onClick={() => setCurrentPage('email-analysis')}
                className="py-3 flex items-start justify-between gap-3 hover:bg-slate-850/50 p-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <RiskBadge status={analysis.threat_classification} size="sm" />
                    <span className="font-mono text-xs text-slate-400 truncate">
                      {analysis.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium truncate mt-1">
                    {analysis.subject}
                  </p>
                  <span className="text-[11px] text-slate-500 truncate mt-0.5">
                    From: {analysis.sender}
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className={`text-xs font-mono font-bold ${
                    analysis.risk_score >= 80 ? 'text-rose-400' :
                    analysis.risk_score >= 60 ? 'text-amber-400' :
                    analysis.risk_score >= 35 ? 'text-yellow-400' : 'text-emerald-400'
                  }`}>
                    {analysis.risk_score}/100
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Score
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
