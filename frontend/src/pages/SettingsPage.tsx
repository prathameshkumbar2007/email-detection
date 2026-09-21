import React, { useState } from 'react';
import { 
  Settings, User, Shield, Moon, Sun, Lock, 
  Database, Bell, CheckCircle, AlertCircle, Save
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [piiRedaction, setPiiRedaction] = useState(true);
  const [retentionDays, setRetentionDays] = useState('90');
  const [torDetection, setTorDetection] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            SOC Configuration & System Settings
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Manage analyst credentials, privacy redaction protocols, appearance modes, and threat feed integration policies.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-400">
          <CheckCircle className="w-4 h-4" />
          <span>Settings saved and committed to local SOC policy profile.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Analyst Identity Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <User className="w-4 h-4 text-cyan-400" />
            <span>Analyst Identity & Access</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Analyst Name</label>
              <input
                type="text"
                value={user?.name || 'Lead Forensic Analyst'}
                disabled
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Role / Security Clearance</label>
              <input
                type="text"
                value={user?.role || 'Tier-2 Forensic Investigator'}
                disabled
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-400 font-mono cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Display & Theme Mode */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span>Interface Appearance</span>
          </h2>

          <div className="flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-slate-200">Dark SOC Navy Theme</div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Optimized for low-light enterprise Security Operations Centers (SOC)
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center space-x-2 font-mono"
            >
              <span>Switch to {theme === 'dark' ? 'Light Theme' : 'Dark Navy SOC'}</span>
            </button>
          </div>
        </div>

        {/* Privacy & Redaction Compliance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Privacy & PII Protection Policies</span>
          </h2>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">Automatic PII Redaction in Shared Reports</div>
                <div className="text-slate-400 text-[11px]">
                  Mask internal recipient email addresses and sensitive employee identifiers in exported dossiers.
                </div>
              </div>
              <input
                type="checkbox"
                checked={piiRedaction}
                onChange={(e) => setPiiRedaction(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">Autonomous Tor / Bulletproof Node Flagging</div>
                <div className="text-slate-400 text-[11px]">
                  Elevate risk tier automatically when BGP origin matches known darknet egress lists.
                </div>
              </div>
              <input
                type="checkbox"
                checked={torDetection}
                onChange={(e) => setTorDetection(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
            </label>
          </div>
        </div>

        {/* Integrations Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>External Threat Intelligence Feeds</span>
          </h2>

          <div className="divide-y divide-slate-800 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">VirusTotal v3 API</div>
                <div className="text-slate-500 text-[11px]">File hash and URL multi-engine scanning</div>
              </div>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] font-mono">
                Not Configured (Demo Mode)
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">AbuseIPDB Telemetry Feed</div>
                <div className="text-slate-500 text-[11px]">IP reputation and malicious reporting engine</div>
              </div>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] font-mono">
                Not Configured (Demo Mode)
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">AlienVault OTX Pulse</div>
                <div className="text-slate-500 text-[11px]">Open threat exchange community IOC indicators</div>
              </div>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] font-mono">
                Not Configured (Demo Mode)
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors shadow"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
