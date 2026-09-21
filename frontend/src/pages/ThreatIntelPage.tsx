import React, { useState } from 'react';
import { 
  Search, Shield, AlertTriangle, CheckCircle, Copy, Check, 
  ExternalLink, ArrowUpRight, Database, Hash, Globe, Mail, 
  Server, Flag, PlusCircle, Clock, ChevronRight
} from 'lucide-react';
import { RiskBadge } from '../components/shared/RiskBadge';

interface IOCResult {
  value: string;
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email';
  reputation_score: number; // 0-100
  threat_status: 'Malicious' | 'Suspicious' | 'Neutral' | 'Clean';
  category: string;
  threat_actor?: string;
  confidence: 'High' | 'Medium' | 'Low';
  first_seen: string;
  last_seen: string;
  detection_ratio: string;
  defanged: string;
  details: {
    country?: string;
    asn?: string;
    isp?: string;
    registrar?: string;
    creation_date?: string;
    dns_records?: string[];
    md5?: string;
    sha256?: string;
    file_type?: string;
  };
  tags: string[];
}

const SAMPLE_INTEL_DB: Record<string, IOCResult> = {
  '185.220.101.5': {
    value: '185.220.101.5',
    type: 'ip',
    reputation_score: 94,
    threat_status: 'Malicious',
    category: 'Tor Anonymizer / Exit Node',
    threat_actor: 'Anonymous Relay Infrastructure',
    confidence: 'High',
    first_seen: '2025-08-12',
    last_seen: '2026-03-18',
    detection_ratio: '62/89',
    defanged: '185[.]220[.]101[.]5',
    details: {
      country: 'Germany (DE)',
      asn: 'AS208323 (TOR-EXIT)',
      isp: 'Zwiebelfreunde e.V.',
      dns_records: ['tor-exit-05.dfri.se'],
    },
    tags: ['TOR', 'PROXY', 'ANONYMIZER', 'SUSPICIOUS_INGRESS'],
  },
  'update-secure-login.com': {
    value: 'update-secure-login.com',
    type: 'domain',
    reputation_score: 96,
    threat_status: 'Malicious',
    category: 'Credential Harvesting / Phishing Kit',
    threat_actor: 'Storm-0558 Simulation',
    confidence: 'High',
    first_seen: '2026-03-01',
    last_seen: '2026-03-20',
    detection_ratio: '58/89',
    defanged: 'hxxp[s]://update-secure-login[.]com',
    details: {
      registrar: 'NameCheap, Inc. (Privacy Shield)',
      creation_date: '2026-03-01 (19 days old)',
      country: 'Seychelles (SC)',
      dns_records: ['A 198.51.100.44', 'MX 0 mail.update-secure-login.com'],
    },
    tags: ['PHISHING', 'TYPOSQUAT', 'MICROSOFT365_LURE', 'FAST_FLUX'],
  },
  '45.33.32.156': {
    value: '45.33.32.156',
    type: 'ip',
    reputation_score: 88,
    threat_status: 'Malicious',
    category: 'Bulletproof Hosting / C2 Infrastructure',
    threat_actor: 'FIN7 Simulation',
    confidence: 'High',
    first_seen: '2025-11-04',
    last_seen: '2026-03-19',
    detection_ratio: '48/89',
    defanged: '45[.]33[.]32[.]156',
    details: {
      country: 'Netherlands (NL)',
      asn: 'AS63949 (Akamai / Linode)',
      isp: 'Linode LLC',
      dns_records: ['li1040-156.members.linode.com'],
    },
    tags: ['C2', 'BULLETPROOF', 'BOTNET_CONTROLLER'],
  },
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855': {
    value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    type: 'hash',
    reputation_score: 98,
    threat_status: 'Malicious',
    category: 'Weaponized VBA Macro / Dropper',
    threat_actor: 'Emotet / Qakbot Variant',
    confidence: 'High',
    first_seen: '2026-02-14',
    last_seen: '2026-03-21',
    detection_ratio: '67/72',
    defanged: 'e3b0c442...b855',
    details: {
      file_type: 'Microsoft Excel 97-2004 (.xls) with obfuscated VBA',
      md5: '7d793037a0760186574b0282f2f435e7',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    tags: ['MACRO_EXEC', 'VBA_OBFUSCATION', 'POWERSHELL_LAUNCHER'],
  },
  'ceo@acmecorp-internal.com': {
    value: 'ceo@acmecorp-internal.com',
    type: 'email',
    reputation_score: 82,
    threat_status: 'Suspicious',
    category: 'Executive Impersonation / Lookalike Domain',
    threat_actor: 'BEC Syndicate',
    confidence: 'High',
    first_seen: '2026-03-10',
    last_seen: '2026-03-21',
    detection_ratio: '41/89',
    defanged: 'ceo[@]acmecorp-internal[.]com',
    details: {
      registrar: 'Porkbun LLC',
      creation_date: '2026-03-08 (Fresh Registration)',
      dns_records: ['v=spf1 ~all', 'DMARC p=none'],
    },
    tags: ['EXECUTIVE_SPOOF', 'WIRE_FRAUD', 'NO_DKIM'],
  }
};

export const ThreatIntelPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeResult, setActiveResult] = useState<IOCResult | null>(SAMPLE_INTEL_DB['185.220.101.5']);
  const [copiedDefanged, setCopiedDefanged] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    '185.220.101.5',
    'update-secure-login.com',
    '45.33.32.156',
    'ceo@acmecorp-internal.com'
  ]);

  const handleSearch = (searchTerm: string) => {
    const clean = searchTerm.trim();
    if (!clean) return;

    if (SAMPLE_INTEL_DB[clean]) {
      setActiveResult(SAMPLE_INTEL_DB[clean]);
    } else {
      // Dynamic fallback simulation
      setActiveResult({
        value: clean,
        type: clean.includes('@') ? 'email' : clean.includes('.') ? 'domain' : 'ip',
        reputation_score: 65,
        threat_status: 'Suspicious',
        category: 'Unverified Telemetry Node',
        confidence: 'Medium',
        first_seen: '2026-03-01',
        last_seen: '2026-03-21',
        detection_ratio: '18/89',
        defanged: clean.replace(/\./g, '[.]').replace(/@/g, '[@]'),
        details: {
          country: 'Unknown Routing',
          asn: 'AS-DYNAMIC-PROBE',
          isp: 'Simulated Threat Network',
        },
        tags: ['SOC_PROBE', 'UNRESOLVED'],
      });
    }

    if (!recentSearches.includes(clean)) {
      setRecentSearches([clean, ...recentSearches.slice(0, 4)]);
    }
  };

  const copyDefanged = (defanged: string) => {
    navigator.clipboard.writeText(defanged);
    setCopiedDefanged(true);
    setTimeout(() => setCopiedDefanged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <div className="flex items-center space-x-2">
          <Database className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Threat Intelligence & IOC Cross-Correlation
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Query global threat feeds, reputation telemetry, passive DNS, and threat actor infrastructure dossiers.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex flex-col md:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search IOC: IP address (185.220.101.5), Domain, URL, Hash (SHA-256), or Email..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>Query Intel</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Sample IOC Buttons */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Quick IOC Presets:</span>
          {Object.keys(SAMPLE_INTEL_DB).map((ioc) => (
            <button
              key={ioc}
              onClick={() => {
                setQuery(ioc);
                handleSearch(ioc);
              }}
              className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700/80 text-cyan-300 rounded border border-slate-700/60 transition-colors"
            >
              {ioc.length > 24 ? `${ioc.slice(0, 16)}...` : ioc}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active IOC Dossier (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeResult ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {activeResult.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400">Threat Dossier</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-slate-100 mt-1 break-all">
                    {activeResult.value}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Reputation Score</div>
                    <div className="text-xl font-mono font-bold text-red-400">
                      {activeResult.reputation_score}/100
                    </div>
                  </div>
                  <RiskBadge tier={activeResult.threat_status === 'Malicious' ? 'CRITICAL' : 'SUSPICIOUS'} size="lg" />
                </div>
              </div>

              {/* Defanged Representation */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Defanged IOC Format (Safe for Sharing)
                  </div>
                  <div className="font-mono text-sm text-cyan-300 font-semibold mt-0.5">
                    {activeResult.defanged}
                  </div>
                </div>
                <button
                  onClick={() => copyDefanged(activeResult.defanged)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded transition-colors"
                >
                  {copiedDefanged ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDefanged ? 'Copied!' : 'Copy Defanged'}</span>
                </button>
              </div>

              {/* Core Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Threat Category</div>
                  <div className="text-xs font-semibold text-slate-200 mt-1 truncate" title={activeResult.category}>
                    {activeResult.category}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Engine Detections</div>
                  <div className="text-xs font-mono font-bold text-red-400 mt-1">
                    {activeResult.detection_ratio}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Confidence</div>
                  <div className="text-xs font-semibold text-emerald-400 mt-1">
                    {activeResult.confidence}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Attributed Group</div>
                  <div className="text-xs font-semibold text-amber-300 mt-1 truncate" title={activeResult.threat_actor || 'Unknown'}>
                    {activeResult.threat_actor || 'Unassigned'}
                  </div>
                </div>
              </div>

              {/* Forensic Details & Attributes */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Enriched Infrastructure Metadata
                </div>
                <div className="bg-slate-950/60 rounded-lg border border-slate-800 divide-y divide-slate-800/60 text-xs">
                  {activeResult.details.country && (
                    <div className="flex justify-between p-3">
                      <span className="text-slate-400">Jurisdiction / Location</span>
                      <span className="font-semibold text-slate-200">{activeResult.details.country}</span>
                    </div>
                  )}
                  {activeResult.details.asn && (
                    <div className="flex justify-between p-3">
                      <span className="text-slate-400">Autonomous System (BGP)</span>
                      <span className="font-mono text-cyan-300">{activeResult.details.asn}</span>
                    </div>
                  )}
                  {activeResult.details.isp && (
                    <div className="flex justify-between p-3">
                      <span className="text-slate-400">Hosting / ISP Provider</span>
                      <span className="text-slate-200">{activeResult.details.isp}</span>
                    </div>
                  )}
                  {activeResult.details.registrar && (
                    <div className="flex justify-between p-3">
                      <span className="text-slate-400">Domain Registrar</span>
                      <span className="text-slate-200">{activeResult.details.registrar}</span>
                    </div>
                  )}
                  {activeResult.details.creation_date && (
                    <div className="flex justify-between p-3">
                      <span className="text-slate-400">Domain Registration Age</span>
                      <span className="text-amber-300 font-semibold">{activeResult.details.creation_date}</span>
                    </div>
                  )}
                  {activeResult.details.md5 && (
                    <div className="flex justify-between p-3">
                      <span className="text-slate-400">MD5 Digest</span>
                      <span className="font-mono text-slate-300">{activeResult.details.md5}</span>
                    </div>
                  )}
                  {activeResult.details.sha256 && (
                    <div className="flex justify-between p-3">
                      <span className="text-slate-400">SHA-256 Digest</span>
                      <span className="font-mono text-slate-300 truncate max-w-[280px]" title={activeResult.details.sha256}>
                        {activeResult.details.sha256}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Threat Tags */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Associated Threat Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeResult.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-slate-800 text-slate-300 rounded border border-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
              No IOC queried yet. Enter an IP, domain, URL, or hash above to query live threat intelligence feeds.
            </div>
          )}
        </div>

        {/* Sidebar: Recent Searches & Actions (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>SOC Incident Response</span>
            </h3>

            <div className="space-y-2.5">
              <a
                href="/cases"
                className="w-full flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <PlusCircle className="w-4 h-4 text-cyan-400" />
                  <span>Attach IOC to Active Case</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>

              <a
                href="/evidence"
                className="w-full flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Archive in Evidence Vault</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>

              <a
                href="/graph"
                className="w-full flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Visualize in Attack Graph</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Recent Query History */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Recent IOC Inquiries</span>
            </h3>

            <div className="space-y-2">
              {recentSearches.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setQuery(item);
                    handleSearch(item);
                  }}
                  className="w-full text-left p-2.5 rounded bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition-colors flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-cyan-300 truncate max-w-[180px]">
                    {item}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">Inspect</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
