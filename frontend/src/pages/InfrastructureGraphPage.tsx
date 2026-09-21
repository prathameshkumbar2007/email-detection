import React, { useState, useRef } from 'react';
import { 
  Network, Search, ZoomIn, ZoomOut, RotateCcw, Filter, 
  Shield, Server, Globe, Mail, FileText, AlertCircle, 
  ExternalLink, ChevronRight, X
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { GraphNode, GraphLink } from '../types';

interface InternalGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const InfrastructureGraphPage: React.FC = () => {
  const { currentAnalysis } = useDemo();
  const [zoom, setZoom] = useState<number>(1);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Generate dynamic forensic nodes & links from current analysis
  const getGraphData = (): InternalGraphData => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Root Email Node
    const emailNodeId = currentAnalysis?.id || 'email-root';
    nodes.push({
      id: emailNodeId,
      label: currentAnalysis?.subject ? currentAnalysis.subject.slice(0, 22) + '...' : 'Suspicious Email',
      type: 'email',
      risk: (currentAnalysis?.risk_tier.toLowerCase() as any) || 'high',
    });

    // Sender Domain Node
    const senderDomain = currentAnalysis?.parsed.from.domain || 'attacker-domain.com';
    const domainNodeId = `domain-${senderDomain}`;
    nodes.push({
      id: domainNodeId,
      label: senderDomain,
      type: 'domain',
      risk: currentAnalysis?.domain_intel.is_typosquatting ? 'critical' : 'suspicious',
    });
    links.push({ source: emailNodeId, target: domainNodeId, relation: 'SENT_FROM_DOMAIN' });

    // Origin Node
    if (currentAnalysis?.origin_node?.ip) {
      const originIp = currentAnalysis.origin_node.ip;
      const ipNodeId = `ip-${originIp}`;
      nodes.push({
        id: ipNodeId,
        label: originIp,
        type: 'ip',
        risk: 'critical',
      });
      links.push({ source: domainNodeId, target: ipNodeId, relation: 'ORIGIN_EGRESS' });

      // ASN Node
      if (currentAnalysis.origin_node.geo?.asn) {
        const asn = currentAnalysis.origin_node.geo.asn;
        const asnNodeId = `asn-${asn}`;
        nodes.push({
          id: asnNodeId,
          label: asn,
          type: 'mail_server',
          risk: 'medium',
        });
        links.push({ source: ipNodeId, target: asnNodeId, relation: 'ROUTED_BY_BGP' });
      }
    }

    // Relay Hops
    currentAnalysis?.relay_hops.forEach((hop, idx) => {
      const hopIpNodeId = `hop-ip-${hop.ip}`;
      if (!nodes.some(n => n.id === hopIpNodeId)) {
        nodes.push({
          id: hopIpNodeId,
          label: `${hop.ip} (${hop.country || 'N/A'})`,
          type: 'ip',
          risk: hop.is_suspicious ? 'high' : 'safe',
        });
        links.push({ source: emailNodeId, target: hopIpNodeId, relation: `RELAY_HOP_${hop.hop_number}` });
      }
    });

    // Extracted URLs
    currentAnalysis?.urls.slice(0, 3).forEach((urlItem, idx) => {
      const urlNodeId = `url-${idx}`;
      nodes.push({
        id: urlNodeId,
        label: urlItem.domain || urlItem.url.slice(0, 20),
        type: 'url',
        risk: urlItem.risk === 'Critical' ? 'critical' : 'suspicious',
      });
      links.push({ source: emailNodeId, target: urlNodeId, relation: 'EMBEDDED_URL' });
    });

    // Attachments
    currentAnalysis?.parsed.attachments.forEach((att, idx) => {
      const attNodeId = `att-${idx}`;
      nodes.push({
        id: attNodeId,
        label: att.filename,
        type: 'indicator',
        risk: 'critical',
      });
      links.push({ source: emailNodeId, target: attNodeId, relation: 'ATTACHMENT' });
    });

    return { nodes, links };
  };

  const graphData = getGraphData();

  // Filter nodes
  const filteredNodes = graphData.nodes.filter(n => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (searchFilter && !n.label.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  const nodePositions: Record<string, { x: number; y: number }> = {};
  const total = filteredNodes.length;
  const radius = 220;
  const centerX = 450;
  const centerY = 280;

  filteredNodes.forEach((node, i) => {
    if (node.type === 'email') {
      nodePositions[node.id] = { x: centerX, y: centerY };
    } else {
      const angle = (i / (total - 1 || 1)) * 2 * Math.PI;
      nodePositions[node.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    }
  });

  const getNodeColor = (type: string, risk: string) => {
    if (risk === 'critical') return '#ef4444';
    if (risk === 'high') return '#f97316';
    if (risk === 'suspicious') return '#eab308';
    if (type === 'email') return '#06b6d4';
    if (type === 'ip') return '#3b82f6';
    if (type === 'domain') return '#8b5cf6';
    return '#10b981';
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Network className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Attack Infrastructure Forensics Graph
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Visual topological mapping of emails, sender domains, BGP Autonomous Systems, IP relays, and embedded IOCs.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search graph nodes..."
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Entity Types</option>
            <option value="email">Emails</option>
            <option value="domain">Domains</option>
            <option value="ip">IP Addresses</option>
            <option value="url">URLs</option>
            <option value="indicator">Indicators</option>
          </select>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 space-x-1">
            <button
              onClick={() => setZoom(Math.min(zoom + 0.2, 2.0))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(Math.max(zoom - 0.2, 0.6))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Graph Area with Drawer */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-[620px] flex items-center justify-center">
        {/* SVG Node-Link Canvas */}
        <svg
          viewBox="0 0 900 560"
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
        >
          <defs>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid Pattern */}
          <pattern id="graphGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#graphGrid)" />

          {/* Draw Links */}
          <g className="links">
            {graphData.links.map((link, idx) => {
              const src = nodePositions[link.source];
              const tgt = nodePositions[link.target];
              if (!src || !tgt) return null;

              const isHighlighted = selectedNode && (selectedNode.id === link.source || selectedNode.id === link.target);

              return (
                <g key={`link-${idx}`}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isHighlighted ? '#38bdf8' : '#334155'}
                    strokeWidth={isHighlighted ? 2.5 : 1.2}
                    strokeDasharray={link.relation.includes('RELAY') ? '4 4' : 'none'}
                    opacity={isHighlighted ? 1 : 0.6}
                  />
                  {/* Relation Label */}
                  <text
                    x={(src.x + tgt.x) / 2}
                    y={(src.y + tgt.y) / 2 - 5}
                    fill="#64748b"
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none"
                  >
                    {link.relation}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Draw Nodes */}
          <g className="nodes">
            {filteredNodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;
              const isSelected = selectedNode?.id === node.id;
              const color = getNodeColor(node.type, node.risk);

              return (
                <g
                  key={node.id}
                  className="cursor-pointer transition-transform duration-200 hover:scale-110"
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Halo */}
                  {isSelected && (
                    <circle cx={pos.x} cy={pos.y} r="28" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                  )}

                  {/* Node Body */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={node.type === 'email' ? 22 : 16}
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth="2.5"
                  />

                  {/* Type Badge / Icon */}
                  <circle cx={pos.x} cy={pos.y} r={node.type === 'email' ? 10 : 7} fill={color} />

                  {/* Text Label */}
                  <text
                    x={pos.x}
                    y={pos.y + (node.type === 'email' ? 34 : 26)}
                    fill={isSelected ? '#38bdf8' : '#cbd5e1'}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    textAnchor="middle"
                    className="drop-shadow-md"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* HUD Statistics Banner */}
        <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs space-y-1 backdrop-blur-sm">
          <div className="font-semibold text-slate-300">Topology Overview</div>
          <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-400">
            <span>Nodes: <strong className="text-cyan-400">{filteredNodes.length}</strong></span>
            <span>Edges: <strong className="text-cyan-400">{graphData.links.length}</strong></span>
            <span>Zoom: <strong className="text-cyan-400">{Math.round(zoom * 100)}%</strong></span>
          </div>
        </div>

        {/* Node Details Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 bg-slate-900/95 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Entity Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Entity Label</div>
                <div className="text-sm font-mono font-bold text-slate-100 break-all">
                  {selectedNode.label}
                </div>
              </div>

              <div className="flex justify-between py-1.5 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Node Type</span>
                <span className="font-semibold text-cyan-300 uppercase">{selectedNode.type}</span>
              </div>

              <div className="flex justify-between py-1.5 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Threat Risk Level</span>
                <span className={`font-semibold uppercase ${
                  selectedNode.risk === 'critical' ? 'text-red-400' :
                  selectedNode.risk === 'high' ? 'text-orange-400' :
                  selectedNode.risk === 'suspicious' ? 'text-yellow-400' : 'text-emerald-400'
                }`}>
                  {selectedNode.risk}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <a
                href={`/threat-intel?q=${encodeURIComponent(selectedNode.label)}`}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors shadow"
              >
                <span>Investigate in Threat Intel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
