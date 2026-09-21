import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { PlayCircle, RotateCcw, Sparkles, ChevronDown, Check, ShieldAlert } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { samples, loadSampleScenario, resetEnvironment, isAnalyzing, setCurrentPage } = useDemo();
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);

  return (
    <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-950/80 to-slate-950 px-4 py-2 text-xs backdrop-blur-md">
      {/* Left: Environment badge */}
      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-mono font-bold text-amber-400 tracking-wider uppercase">
          <ShieldAlert className="h-3.5 w-3.5" />
          Simulated Demo Environment
        </span>
        <span className="hidden sm:inline text-slate-400 text-[11px]">
          Digital Forensic Research & College Project Presentation Mode
        </span>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-2.5 ml-auto">
        {/* Scenario Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            disabled={isAnalyzing}
            className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1 font-semibold text-sky-300 hover:bg-sky-500/20 transition-all text-xs disabled:opacity-50"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            <span>Load Demo Threat Scenario</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showScenarioMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                Select Pre-Packaged Threat Sample
              </div>
              <div className="space-y-1 mt-1">
                {samples.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={async () => {
                      setShowScenarioMenu(false);
                      setCurrentPage('email-analysis');
                      await loadSampleScenario(s.id);
                    }}
                    className="flex w-full flex-col rounded-lg p-2 text-left hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-200">
                      {idx + 1}. {s.name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate mt-0.5">
                      {s.threat_profile}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reset Demo Button */}
        <button
          onClick={resetEnvironment}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors text-xs"
          title="Reset all cases and demo data to baseline state"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Reset Demo</span>
        </button>
      </div>
    </div>
  );
};
