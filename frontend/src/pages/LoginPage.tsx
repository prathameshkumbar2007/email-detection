import React, { useState } from 'react';
import { useAuth, UserProfile } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { Shield, Lock, Mail, Eye, EyeOff, UserCheck, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginAs } = useAuth();
  const { setCurrentPage } = useDemo();

  const [email, setEmail] = useState('s.chen@cybertrace.internal');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const demoRoles: Array<{ label: string; desc: string; profile: UserProfile }> = [
    {
      label: 'Lead Forensic Analyst',
      desc: 'Tier 3 Incident Responder (Full Access)',
      profile: {
        name: 'Sarah Chen',
        role: 'Lead Threat Analyst (Tier 3)',
        email: 's.chen@cybertrace.internal',
        badgeId: 'SOC-9042',
        clearance: 'TS/SCI Cyber Forensics'
      }
    },
    {
      label: 'SOC Incident Commander',
      desc: 'Operations Oversight & Escalations',
      profile: {
        name: 'Alex Mercer',
        role: 'SOC Incident Commander',
        email: 'a.mercer@cybertrace.internal',
        badgeId: 'CMD-1084',
        clearance: 'Secret / Incident Response'
      }
    },
    {
      label: 'Digital Forensics Examiner',
      desc: 'Evidentiary Custody & Legal Compliance',
      profile: {
        name: 'Marcus Vance',
        role: 'Senior Forensics Specialist',
        email: 'm.vance@cybertrace.internal',
        badgeId: 'EVD-3310',
        clearance: 'DFIR Specialist'
      }
    }
  ];

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    loginAs(demoRoles[0].profile);
    setCurrentPage('dashboard');
  };

  const handleQuickLogin = (profile: UserProfile) => {
    loginAs(profile);
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-xl shadow-sky-500/25 border border-sky-400/30 mb-2">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 font-mono">
            CYBERTRACE <span className="text-sky-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Intelligent Email Threat Detection & Forensic Intelligence
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Analyst Authentication
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Enterprise SOC
            </span>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Security Password / Token
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-10 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Remember session</span>
              </label>
              <span className="text-slate-500 text-[11px]">Hardware Token: Ready</span>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all font-mono tracking-wider uppercase"
            >
              Sign In to Operations Console
            </button>
          </form>

          {/* Quick Demo Access Roles */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
              1-Click Demo Access (University Presentation)
            </span>
            <div className="grid grid-cols-1 gap-2">
              {demoRoles.map(role => (
                <button
                  key={role.label}
                  type="button"
                  onClick={() => handleQuickLogin(role.profile)}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-left hover:border-sky-500/40 hover:bg-slate-950 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="h-4 w-4 text-sky-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-sky-300">
                        {role.label}
                      </div>
                      <div className="text-[10px] text-slate-400">{role.desc}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Access →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prototype Caveat Notice */}
        <div className="text-center text-[11px] text-slate-500">
          CyberTrace AI Research Demonstration • RFC 5322 Forensics Engine v2.4
        </div>
      </div>
    </div>
  );
};
