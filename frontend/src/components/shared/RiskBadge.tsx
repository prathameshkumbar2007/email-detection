import React from 'react';

interface RiskBadgeProps {
  status?: string;
  tier?: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ status, tier, size = 'md', showDot = true }) => {
  const norm = (status || tier || '').toLowerCase().trim();

  let colorClasses = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  let dotColor = 'bg-slate-400';

  if (norm.includes('critical') || norm === 'fail' || norm === 'reject' || norm === 'phishing' || norm === 'fraud-related') {
    colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    dotColor = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]';
  } else if (norm.includes('high') || norm === 'suspicious' || norm === 'impersonation') {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]';
  } else if (norm.includes('medium') || norm === 'softfail' || norm === 'under review' || norm === 'evidence review') {
    colorClasses = 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
    dotColor = 'bg-yellow-400';
  } else if (norm.includes('low') || norm.includes('safe') || norm === 'pass' || norm === 'legitimate' || norm === 'resolved' || norm === 'closed') {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    dotColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
  } else if (norm === 'neutral' || norm === 'none' || norm === 'open' || norm === 'active') {
    colorClasses = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    dotColor = 'bg-sky-400';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 font-medium tracking-wide uppercase',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wider uppercase',
    lg: 'text-sm px-3.5 py-1.5 font-bold tracking-wider uppercase',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-mono ${colorClasses} ${sizeClasses}`}>
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
      <span>{status}</span>
    </span>
  );
};
