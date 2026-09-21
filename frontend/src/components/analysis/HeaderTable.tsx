import React, { useState } from 'react';
import { RelayHop } from '../../types';
import { Copy, Check, ShieldAlert, ArrowRight } from 'lucide-react';

interface HeaderTableProps {
  hops: RelayHop[];
}

export const HeaderTable: React.FC<HeaderTableProps> = ({ hops }) => {
  const [filter, setFilter] = useState('');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const handleCopy = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const filteredHops = hops.filter(h =>
    h.ip.toLowerCase().includes(filter.toLowerCase()) ||
    h.receiving_host.toLowerCase().includes(filter.toLowerCase()) ||
    h.sending_host.toLowerCase().includes(filter.toLowerCase()) ||
    (h.country && h.country.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter hops by IP, host, or country..."
          className="w-full max-w-xs rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
        />
        <span className="text-xs font-mono text-slate-400">
          Showing {filteredHops.length} of {hops.length} hops
        </span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">Hop</th>
              <th className="py-3 px-3">Sending Host</th>
              <th className="py-3 px-3">Receiving Host</th>
              <th className="py-3 px-3">IP Address</th>
              <th className="py-3 px-3">Location / ASN</th>
              <th className="py-3 px-3">Delay</th>
              <th className="py-3 px-3">Assessment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredHops.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">
                  No relay transmission hops match the search filter.
                </td>
              </tr>
            ) : (
              filteredHops.map((hop, idx) => (
                <tr
                  key={hop.hop_number || idx}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    hop.is_suspicious ? 'bg-rose-500/5' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-slate-400">
                    #{hop.hop_number}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 max-w-[160px] truncate" title={hop.sending_host}>
                    {hop.sending_host || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 max-w-[160px] truncate" title={hop.receiving_host}>
                    {hop.receiving_host || '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sky-300 font-semibold">{hop.ip}</span>
                      <button
                        onClick={() => handleCopy(hop.ip)}
                        className="text-slate-500 hover:text-slate-300"
                        title="Copy IP"
                      >
                        {copiedIp === hop.ip ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-400">
                    <div>{hop.city ? `${hop.city}, ${hop.country}` : hop.country || 'Unknown'}</div>
                    {hop.asn && <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{hop.asn}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-400">
                    {hop.delay_seconds ? `+${hop.delay_seconds}s` : '0s'}
                  </td>
                  <td className="py-2.5 px-3">
                    {hop.is_suspicious ? (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                        <ShieldAlert className="h-3 w-3" />
                        SUSPICIOUS
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-semibold">Standard</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
