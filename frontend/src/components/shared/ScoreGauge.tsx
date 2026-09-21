import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  classification?: string;
  confidence?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 180,
  strokeWidth = 14,
  classification = 'Suspicious',
  confidence = 'High',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 270 degree arc for an executive instrument gauge
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (score / 100) * arcLength;

  let color = '#10B981'; // safe
  let glowColor = 'rgba(16, 185, 129, 0.2)';
  let tier = 'SAFE';

  if (score >= 80) {
    color = '#EF4444'; // critical
    glowColor = 'rgba(239, 68, 68, 0.35)';
    tier = 'CRITICAL RISK';
  } else if (score >= 60) {
    color = '#F97316'; // high
    glowColor = 'rgba(249, 115, 22, 0.3)';
    tier = 'HIGH RISK';
  } else if (score >= 35) {
    color = '#F59E0B'; // medium / suspicious
    glowColor = 'rgba(245, 158, 11, 0.25)';
    tier = 'SUSPICIOUS';
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-2">
      <svg
        width={size}
        height={size}
        className="transform -rotate-135 transition-all duration-700 ease-out"
        style={{ filter: `drop-shadow(0 0 16px ${glowColor})` }}
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Animated Score Bar */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center Score Readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-extrabold tracking-tight font-mono text-slate-100">
          {score}
        </span>
        <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase mt-0.5">
          / 100 RISK
        </span>
        <span
          className="text-xs font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded"
          style={{ color, backgroundColor: `${color}18` }}
        >
          {tier}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <span>Confidence:</span>
        <span className="font-semibold text-slate-200">{confidence}</span>
      </div>
    </div>
  );
};
