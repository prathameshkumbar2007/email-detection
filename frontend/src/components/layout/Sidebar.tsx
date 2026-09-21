import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  MailCheck,
  Binary,
  Globe2,
  Share2,
  FolderSearch,
  AlertOctagon,
  FileText,
  Lock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  Search
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { currentPage, setCurrentPage } = useDemo();
  const { user } = useAuth();

  const navGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'ANALYSIS',
      items: [
        { id: 'email-analysis', label: 'Email Analysis', icon: MailCheck },
        { id: 'header-forensics', label: 'Header Forensics', icon: Binary },
        { id: 'threat-intel', label: 'Threat Intelligence', icon: Search },
        { id: 'geolocation', label: 'Geolocation', icon: Globe2 },
        { id: 'infrastructure-graph', label: 'Infrastructure Graph', icon: Share2 },
      ],
    },
    {
      group: 'INVESTIGATION',
      items: [
        { id: 'cases', label: 'Investigation Cases', icon: FolderSearch },
        { id: 'alerts', label: 'Security Alerts', icon: AlertOctagon, badge: '6' },
        { id: 'reports', label: 'Forensic Reports', icon: FileText },
        { id: 'evidence', label: 'Evidence Vault', icon: Lock },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Platform Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-md transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
          <div
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-md shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-all">
              <Shield className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm tracking-wider text-slate-100 flex items-center gap-1.5 font-mono">
                  CYBERTRACE <span className="text-[10px] px-1 py-0.2 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded">AI</span>
                </span>
                <span className="text-[10px] font-medium tracking-tight text-slate-400 truncate">
                  Threat Forensics SOC
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map(group => (
            <div key={group.group} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                  {group.group}
                </div>
              )}
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setMobileOpen(false);
                    }}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    {!collapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.2 text-[10px] font-mono font-bold text-rose-400">
                        {item.badge}
                      </span>
                    )}
                    {collapsed && isActive && (
                      <div className="absolute left-0 h-6 w-1 rounded-r bg-sky-400" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* System Status & Analyst Profile */}
        <div className="border-t border-slate-800/80 p-3 space-y-3 bg-slate-950">
          {/* Status badge */}
          <div className={`flex items-center gap-2 rounded-lg bg-slate-900/80 border border-slate-800/60 p-2 text-xs ${collapsed ? 'justify-center' : ''}`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1 font-mono">
                  SYSTEM ONLINE
                </span>
                <span className="text-[10px] text-slate-400">Operational (Demo)</span>
              </div>
            )}
          </div>

          {/* User profile */}
          <div
            onClick={() => setCurrentPage('settings')}
            className={`flex items-center gap-3 rounded-lg p-2 hover:bg-slate-900 transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-300 font-bold font-mono text-xs border border-indigo-500/30">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-200 truncate">{user.name}</span>
                <span className="text-[10px] text-slate-400 truncate">{user.role}</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
