import React, { useMemo } from 'react';
import { Copy, Trash2, Check } from 'lucide-react';

interface RawEmailEditorProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  readOnly?: boolean;
}

export const RawEmailEditor: React.FC<RawEmailEditorProps> = ({
  value,
  onChange,
  onClear,
  readOnly = false,
}) => {
  const [copied, setCopied] = React.useState(false);

  const lines = useMemo(() => {
    const count = (value || '').split('\n').length;
    return Array.from({ length: Math.max(count, 18) }, (_, i) => i + 1);
  }, [value]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col h-[480px]">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400 font-medium">RFC 5322 MIME Inspector</span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] font-mono text-slate-500">
            {value.length.toLocaleString()} bytes ({lines.length} lines)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!value}
            className="flex items-center gap-1.5 rounded border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors disabled:opacity-40 text-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          {!readOnly && (
            <button
              type="button"
              onClick={onClear}
              disabled={!value}
              className="flex items-center gap-1.5 rounded border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-slate-400 hover:text-rose-300 hover:border-rose-500/30 transition-colors disabled:opacity-40 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Body with Gutter */}
      <div className="flex flex-1 overflow-hidden">
        {/* Line Numbers Gutter */}
        <div className="w-12 select-none border-r border-slate-800/80 bg-slate-950/90 py-3 pr-2 text-right font-mono text-xs text-slate-600 overflow-hidden">
          {lines.map(num => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          placeholder="Paste raw email RFC 5322 headers and MIME body here...&#10;&#10;Received: from mail.example.com...&#10;From: sender@domain.com&#10;Subject: Urgent Inquiry..."
          className="flex-1 bg-transparent p-3 font-mono text-xs leading-6 text-slate-200 placeholder-slate-600 focus:outline-none resize-none overflow-y-auto"
        />
      </div>
    </div>
  );
};
