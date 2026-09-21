import React, { useState } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  timeRange?: string;
  tooltipText?: string;
  badgeColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  timeRange = 'Last 24h',
  tooltipText,
  badgeColor = 'text-sky-400 bg-sky-500/10 border-sky-500/20',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm transition-all hover:border-slate-700/80 hover:shadow-lg hover:shadow-sky-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
          {tooltipText && (
            <div className="relative inline-block">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="More information"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
              {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-slate-950 px-2.5 py-1.5 text-[11px] leading-snug text-slate-300 shadow-xl border border-slate-800 z-50">
                  {tooltipText}
                </div>
              )}
            </div>
          )}
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${badgeColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-slate-100 font-mono">{value}</div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend.isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
        <span className="truncate max-w-[180px]">{description}</span>
        <span className="font-mono text-slate-500 text-[10px]">{timeRange}</span>
      </div>
    </div>
  );
};
