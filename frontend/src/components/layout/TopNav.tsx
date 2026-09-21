import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Shield,
  Layers,
  ChevronDown,
  Menu,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

interface TopNavProps {
  onOpenCommand: () => void;
  setMobileOpen: (o: boolean) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenCommand, setMobileOpen }) => {
  const { activeWorkspace, setActiveWorkspace, currentPage, setCurrentPage } = useDemo();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const workspaces = [
    'Global SOC - Enterprise',
    'EMEA Incident Response Team',
    'Executive & VIP Threat Protection',
    'R&D Security Sandbox'
  ];

  const recentAlerts = [
    { id: '1', title: 'CEO BEC Wire Transfer Intercepted', time: '12m ago', critical: true },
    { id: '2', title: 'Credential Harvester Lookalike Domain', time: '1h ago', critical: false },
    { id: '3', title: 'Macro Payload Detonated in Sandbox', time: '3h ago', critical: true },
  ];

  const pageNames: Record<string, string> = {
    'dashboard': 'Security Intelligence Overview',
    'email-analysis': 'AI Email Threat Analysis',
    'header-forensics': 'Email Header Forensics',
    'threat-intel': 'Threat Intelligence Repository',
    'geolocation': 'IP Geolocation & Infrastructure',
    'infrastructure-graph': 'Infrastructure Relationship Graph',
    'cases': 'Investigation Cases',
    'alerts': 'Security Alerts Center',
    'reports': 'Forensic Reports Management',
    'evidence': 'Digital Evidence Vault',
    'settings': 'Platform Settings & Integrations'
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 lg:px-8 backdrop-blur-md">
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-slate-500 uppercase">CyberTrace</span>
          <span className="text-slate-600">/</span>
          <span className="font-semibold text-slate-200">{pageNames[currentPage] || 'Dashboard'}</span>
        </div>
      </div>

      {/* Center: Global Search Bar with Ctrl+K trigger */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <button
          type="button"
          onClick={onOpenCommand}
          className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2 text-xs text-slate-400 hover:border-slate-700 hover:bg-slate-900 transition-all shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-500" />
            <span>Search Case ID, IP, Domain, Hash, or Alert...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Workspace selector */}
        <div className="relative">
          <button
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900 transition-colors"
          >
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            <span className="font-medium max-w-[140px] truncate">{activeWorkspace}</span>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>

          {showWorkspaceDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50">
              <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Security Workspace
              </div>
              {workspaces.map(ws => (
                <button
                  key={ws}
                  onClick={() => {
                    setActiveWorkspace(ws);
                    setShowWorkspaceDropdown(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-left transition-colors ${
                    activeWorkspace === ws ? 'bg-sky-500/15 text-sky-300' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{ws}</span>
                  {activeWorkspace === ws && <CheckCircle className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200">Security Telemetry Alerts</span>
                <button
                  onClick={() => {
                    setCurrentPage('alerts');
                    setShowNotifications(false);
                  }}
                  className="text-[10px] font-medium text-sky-400 hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {recentAlerts.map(a => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setCurrentPage('alerts');
                      setShowNotifications(false);
                    }}
                    className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-slate-800/70 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${a.critical ? 'text-rose-400' : 'text-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{a.title}</p>
                      <span className="text-[10px] font-mono text-slate-400">{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
        </button>

        {/* Analyst Profile Chip */}
        <div
          onClick={() => setCurrentPage('settings')}
          className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-800 cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-xs font-bold">
            SC
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</span>
            <span className="text-[10px] text-emerald-400 font-mono">Tier 3 Certified</span>
          </div>
        </div>
      </div>
    </header>
  );
};
