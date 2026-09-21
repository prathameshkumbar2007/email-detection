import React from 'react';
import { useDemo } from '../../context/DemoContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useDemo();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => {
        let border = 'border-sky-500/30 bg-slate-900/95 text-sky-300';
        let Icon = Info;
        if (t.type === 'success') {
          border = 'border-emerald-500/30 bg-slate-900/95 text-emerald-300';
          Icon = CheckCircle2;
        } else if (t.type === 'warning') {
          border = 'border-amber-500/30 bg-slate-900/95 text-amber-300';
          Icon = AlertTriangle;
        } else if (t.type === 'error') {
          border = 'border-rose-500/30 bg-slate-900/95 text-rose-300';
          Icon = XCircle;
        }

        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all ${border}`}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-100">{t.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
