import React, { useState, useEffect } from 'react';
import { 
  Globe, MapPin, Server, Shield, AlertTriangle, Info, Copy, 
  Check, ExternalLink, ArrowRight, Compass, Radio, Activity
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { RelayHop } from '../types';

// Mock coordinates dictionary for known cities/countries
const GEO_COORDS: Record<string, [number, number]> = {
  'Frankfurt': [50.1109, 8.6821],
  'Germany': [51.1657, 10.4515],
  'Amsterdam': [52.3676, 4.9041],
  'Netherlands': [52.1326, 5.2913],
  'Bucharest': [44.4268, 26.1025],
  'Romania': [45.9432, 24.9668],
  'Moscow': [55.7558, 37.6173],
  'Russia': [61.5240, 105.3188],
  'Ashburn': [39.0438, -77.4874],
  'Virginia': [37.4316, -78.6569],
  'United States': [37.0902, -95.7129],
  'Redmond': [47.6740, -122.1215],
  'Washington': [47.7511, -120.7401],
  'London': [51.5074, -0.1278],
  'United Kingdom': [55.3781, -3.4360],
  'Zurich': [47.3769, 8.5417],
  'Switzerland': [46.8182, 8.2275],
  'Singapore': [1.3521, 103.8198],
  'Tokyo': [35.6762, 139.6503],
  'Japan': [36.2048, 138.2529],
  'Seychelles': [-4.6796, 55.4920],
  'Victoria': [-4.6191, 55.4513],
};

export const GeolocationPage: React.FC = () => {
  const { currentAnalysis, samples, loadSample } = useDemo();
  const [selectedHopIndex, setSelectedHopIndex] = useState<number>(0);
  const [copiedIp, setCopiedIp] = useState(false);

  const hops: RelayHop[] = currentAnalysis?.relay_hops || [];
  const originNode = currentAnalysis?.origin_node;
  const selectedHop = hops[selectedHopIndex] || hops[0] || null;

  useEffect(() => {
    if (hops.length > 0) {
      setSelectedHopIndex(0);
    }
  }, [currentAnalysis]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  // Convert lat/lng to SVG X/Y (Equirectangular projection)
  const coordsToSvg = (lat: number, lng: number) => {
    // Map bounds: Lat [-60, 80], Lng [-180, 180]
    const x = ((lng + 180) / 360) * 900 + 50;
    const y = ((85 - lat) / 170) * 450 + 25;
    return { x, y };
  };

  // Resolve coordinates for hop
  const getHopCoords = (hop: RelayHop): [number, number] => {
    if (hop.city && GEO_COORDS[hop.city]) return GEO_COORDS[hop.city];
    if (hop.country && GEO_COORDS[hop.country]) return GEO_COORDS[hop.country];
    // Hash IP to semi-deterministic location if unknown
    const hash = hop.ip.split('.').reduce((acc, oct) => acc + parseInt(oct || '0', 10), 0);
    return [20 + (hash % 45), -60 + ((hash * 7) % 180)];
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Context Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Globe className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Infrastructure Geolocation & Relay Path
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Global geographic tracing of SMTP routing relays, BGP Autonomous Systems, and origin infrastructure.
          </p>
        </div>

        {/* Quick Scenario Selector */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-1.5">
          <span className="text-xs text-slate-400 font-medium px-2">Sample Path:</span>
          <div className="flex space-x-1">
            {samples.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => loadSample(s.id)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  currentAnalysis?.id === s.id
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={s.name}
              >
                Path {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mandatory SOC Forensic Caution Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-3.5">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-amber-300">SCIENTIFIC & LEGAL LIMITATION NOTICE:</span>{' '}
          IP geolocation identifies physical routing equipment (data centers, VPN egress gateways, residential proxies, or BGP announcements). 
          It <span className="underline font-semibold text-amber-200">does not establish the true physical location, nationality, or identity</span> of 
          the human actor. CyberTrace AI strictly records these as approximate infrastructure indicators in compliance with NIST SP 800-86 standards.
        </div>
      </div>

      {/* Main Map & Detail Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* World Map Container (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 z-10">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Interactive Global Relay Vector Map
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/30 animate-pulse"></span>
                <span className="text-slate-400">Origin Hop</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span className="text-slate-400">Intermediate Relay</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-slate-400">Destination MX</span>
              </span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full aspect-[2/1] bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
            {/* World Landmass Silhouettes (Simplified SVG Paths) */}
            <svg viewBox="0 0 1000 500" className="w-full h-full select-none">
              <defs>
                <linearGradient id="relayGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Lines */}
              <g stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3">
                <line x1="0" y1="125" x2="1000" y2="125" />
                <line x1="0" y1="250" x2="1000" y2="250" />
                <line x1="0" y1="375" x2="1000" y2="375" />
                <line x1="250" y1="0" x2="250" y2="500" />
                <line x1="500" y1="0" x2="500" y2="500" />
                <line x1="750" y1="0" x2="750" y2="500" />
              </g>

              {/* Stylized Landmass Polygons */}
              {/* North America */}
              <path d="M120 70 L250 65 L310 110 L280 190 L220 230 L190 280 L160 250 L110 180 Z" fill="#1e293b" opacity="0.6" />
              {/* South America */}
              <path d="M220 290 L280 300 L320 370 L280 470 L240 440 L210 350 Z" fill="#1e293b" opacity="0.6" />
              {/* Europe */}
              <path d="M470 80 L560 70 L570 140 L510 170 L460 140 Z" fill="#1e293b" opacity="0.7" />
              {/* Africa */}
              <path d="M460 180 L550 170 L590 260 L540 380 L480 380 L440 250 Z" fill="#1e293b" opacity="0.6" />
              {/* Asia */}
              <path d="M570 70 L830 80 L880 180 L760 260 L620 240 L570 140 Z" fill="#1e293b" opacity="0.65" />
              {/* Australia */}
              <path d="M770 330 L870 340 L880 420 L780 420 Z" fill="#1e293b" opacity="0.6" />

              {/* Draw Relay Paths (Bezier curves connecting hops) */}
              {hops.map((hop, i) => {
                if (i === hops.length - 1) return null;
                const nextHop = hops[i + 1];
                const [lat1, lng1] = getHopCoords(hop);
                const [lat2, lng2] = getHopCoords(nextHop);
                const p1 = coordsToSvg(lat1, lng1);
                const p2 = coordsToSvg(lat2, lng2);
                const cx = (p1.x + p2.x) / 2;
                const cy = Math.min(p1.y, p2.y) - 30;

                return (
                  <g key={`path-${i}`}>
                    <path
                      d={`M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`}
                      fill="none"
                      stroke={i === 0 ? '#ef4444' : '#06b6d4'}
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />
                    <circle cx={p1.x} cy={p1.y} r="3" fill="#06b6d4" />
                  </g>
                );
              })}

              {/* Hop Markers */}
              {hops.map((hop, i) => {
                const [lat, lng] = getHopCoords(hop);
                const { x, y } = coordsToSvg(lat, lng);
                const isOrigin = i === 0;
                const isSelected = i === selectedHopIndex;

                return (
                  <g 
                    key={`marker-${i}`}
                    className="cursor-pointer transition-transform duration-200 hover:scale-125"
                    onClick={() => setSelectedHopIndex(i)}
                  >
                    {/* Pulsing ring for origin */}
                    {isOrigin && (
                      <circle cx={x} cy={y} r="14" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.7">
                        <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Selected marker halo */}
                    {isSelected && (
                      <circle cx={x} cy={y} r="12" fill="none" stroke="#38bdf8" strokeWidth="2" />
                    )}

                    {/* Main Dot */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isOrigin ? 7 : 5}
                      fill={isOrigin ? '#ef4444' : i === hops.length - 1 ? '#10b981' : '#06b6d4'}
                      stroke="#0f172a"
                      strokeWidth="2"
                      filter="url(#glow)"
                    />

                    {/* Text Label */}
                    <text
                      x={x + 10}
                      y={y + 4}
                      fill={isSelected ? '#38bdf8' : '#cbd5e1'}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      className="drop-shadow-md"
                    >
                      Hop {hop.hop_number}: {hop.city || hop.country || 'Unknown'}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Coordinates HUD overlay */}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1 text-[11px] font-mono text-slate-400">
              HUD: Lat/Lng Grid | Projection: WGS84 Equirectangular
            </div>
          </div>

          {/* Sequential Hop Timeline Slider */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Hop Sequence Path:</span>
            <div className="flex items-center space-x-2 overflow-x-auto py-1">
              {hops.map((h, i) => (
                <button
                  key={h.hop_number}
                  onClick={() => setSelectedHopIndex(i)}
                  className={`px-3 py-1.5 rounded text-xs font-mono flex items-center space-x-1.5 transition-all ${
                    selectedHopIndex === i
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-red-500' : 'bg-cyan-400'}`} />
                  <span>Hop {h.hop_number}</span>
                  <span className="text-[10px] text-slate-400">({h.country || 'N/A'})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Hop Forensics Dossier (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xl">
          {selectedHop ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-slate-100">
                    Relay Hop {selectedHop.hop_number} Dossier
                  </h2>
                </div>
                {selectedHopIndex === 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 rounded">
                    ORIGIN NODE
                  </span>
                )}
              </div>

              {/* IP & Copy */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Relay IP Address
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-cyan-300">
                    {selectedHop.ip}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedHop.ip)}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copy IP"
                  >
                    {copiedIp ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Geo & Network Details */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Country / City</span>
                  <span className="font-semibold text-slate-200">
                    {selectedHop.country || 'Unknown'} {selectedHop.city ? `/ ${selectedHop.city}` : ''}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Autonomous System (ASN)</span>
                  <span className="font-mono text-cyan-400 font-medium">
                    {selectedHop.asn || 'AS-UNKNOWN'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Internet Service Provider</span>
                  <span className="text-slate-200 truncate max-w-[180px]" title={selectedHop.isp || 'N/A'}>
                    {selectedHop.isp || 'Unknown ISP'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Receiving Host</span>
                  <span className="font-mono text-slate-300 truncate max-w-[180px]" title={selectedHop.receiving_host}>
                    {selectedHop.receiving_host || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Sending Host</span>
                  <span className="font-mono text-slate-300 truncate max-w-[180px]" title={selectedHop.sending_host}>
                    {selectedHop.sending_host || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Relay Latency / Delay</span>
                  <span className="font-mono text-amber-400">
                    {selectedHop.delay_seconds > 0 ? `+${selectedHop.delay_seconds}s` : 'Instantaneous (0s)'}
                  </span>
                </div>
              </div>

              {/* Anomaly & Threat Indicator Badges */}
              <div className="pt-2">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                  Infrastructure Classification
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded border text-[11px] flex items-center space-x-1.5 ${
                    selectedHop.is_suspicious 
                      ? 'bg-red-500/10 border-red-500/30 text-red-300' 
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-300'
                  }`}>
                    <Activity className="w-3.5 h-3.5 shrink-0" />
                    <span>{selectedHop.is_suspicious ? 'Flagged Anomaly' : 'Standard MX'}</span>
                  </div>

                  <div className={`p-2 rounded border text-[11px] flex items-center space-x-1.5 ${
                    selectedHop.asn?.includes('TOR') || selectedHop.isp?.toLowerCase().includes('bulletproof')
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-300'
                  }`}>
                    <Radio className="w-3.5 h-3.5 shrink-0" />
                    <span>{selectedHop.asn?.includes('TOR') ? 'Tor Exit' : 'Datacenter IP'}</span>
                  </div>
                </div>
              </div>

              {/* Evidence Note */}
              {selectedHop.evidence_note && (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-400 italic">
                  "{selectedHop.evidence_note}"
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Select a relay hop from the map to inspect infrastructure intelligence.
            </div>
          )}

          {/* Pivot to Threat Intel Button */}
          {selectedHop && (
            <div className="pt-4 border-t border-slate-800">
              <a
                href={`/threat-intel?q=${encodeURIComponent(selectedHop.ip)}`}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors shadow"
              >
                <span>Pivot to Threat Intel on {selectedHop.ip}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
