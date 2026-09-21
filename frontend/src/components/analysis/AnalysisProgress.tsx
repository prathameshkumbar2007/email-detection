import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

interface AnalysisProgressProps {
  onComplete?: () => void;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ onComplete }) => {
  const steps = [
    { title: 'Parsing RFC 5322 MIME Structure', desc: 'Decoding multipart boundaries, body payloads & attachments' },
    { title: 'Extracting SMTP Transmission Headers', desc: 'Reconstructing chronological Received: hops and latency' },
    { title: 'Checking Authentication Protocols', desc: 'Validating SPF records, DKIM cryptographic signatures & DMARC' },
    { title: 'Extracting Indicators & Domain Intel', desc: 'Parsing hyperlinks, scanning typosquatting and homoglyphs' },
    { title: 'Running Threat Detection & NLP Rules', desc: 'Evaluating urgency language, payment coercion & BEC indicators' },
    { title: 'Synthesizing Evidentiary Findings', desc: 'Calculating normalized threat score and generating custody seals' },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          if (onComplete) setTimeout(onComplete, 300);
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
            Active Forensic Pipeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Step {currentStep + 1} of {steps.length} — Processing telemetry
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded">
          {Math.round(((currentStep + 1) / steps.length) * 100)}%
        </span>
      </div>

      <div className="space-y-3.5">
        {steps.map((s, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={s.title}
              className={`flex items-start gap-3.5 rounded-xl p-3 transition-all ${
                isCurrent
                  ? 'bg-sky-500/10 border border-sky-500/30'
                  : isDone
                  ? 'bg-slate-950/40 border border-slate-800/60 opacity-80'
                  : 'opacity-40'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 text-sky-400 animate-spin" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold ${isCurrent ? 'text-sky-300' : isDone ? 'text-slate-200' : 'text-slate-400'}`}>
                  {s.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
