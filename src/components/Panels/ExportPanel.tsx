import React, { useRef } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import type { MindMapNode } from '../../types';

export const ExportPanel: React.FC = () => {
  const activePanel = useUIStore(s => s.activePanel);
  const setActivePanel = useUIStore(s => s.setActivePanel);
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const importMap = useMapStore(s => s.importMap);
  const setActiveMap = useMapStore(s => s.setActiveMap);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (activePanel !== 'export') return null;

  const map = maps.find(m => m.id === activeMapId);

  function toMarkdown(nodeId: string, nodes: Record<string, MindMapNode>, depth = 0): string {
    const node = nodes[nodeId];
    if (!node) return '';
    const indent = '  '.repeat(depth);
    const bullet = depth === 0 ? '#' : depth === 1 ? '##' : '-';
    const prefix = depth <= 1 ? bullet + ' ' : indent + '- ';
    let md = `${prefix}${node.content.text || 'Untitled'}\n`;
    if (node.content.note) md += `${indent}  > ${node.content.note}\n`;
    for (const childId of node.childrenIds) {
      md += toMarkdown(childId, nodes, depth + 1);
    }
    return md;
  }

  function exportJSON() {
    if (!map) return;
    const json = JSON.stringify(map, null, 2);
    download(json, `${map.title}.json`, 'application/json');
  }

  function exportMarkdown() {
    if (!map) return;
    const rootIds = map.rootNodeIds || [map.rootNodeId];
    const md = rootIds.map(rid => toMarkdown(rid, map.nodes)).join('\n\n---\n\n');
    download(md, `${map.title}.md`, 'text/markdown');
  }

  function exportSVG() {
    const svgEl = document.querySelector('.connector-svg')?.closest('.canvas-transform');
    if (!svgEl) { alert('Open a map to export SVG'); return; }
    const html = svgEl.innerHTML;
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2000 -2000 6000 4000">${html}</svg>`;
    download(svgContent, `${map?.title || 'map'}.svg`, 'image/svg+xml');
  }

  function download(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      const newId = importMap(json);
      if (newId) {
        setActiveMap(newId);
        setActivePanel(null);
      } else {
        alert('Invalid JSON map file. Make sure it is a valid Alpha Mind Map export.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div
      className="panel-enter"
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 300, background: '#fff', borderLeft: '1px solid #DFE6E9',
        zIndex: 30, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 16px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #DFE6E9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: '#2D3436' }}>Export / Import</span>
        <button onClick={() => setActivePanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#636E72' }}>×</button>
      </div>

      <div style={{ padding: 20, flex: 1, overflow: 'auto' }}>
        <Section title="Export">
          <ExportBtn icon="{ }" label="Export JSON" desc="Full map data, re-importable" onClick={exportJSON} />
          <ExportBtn icon="# " label="Export Markdown" desc="Nested bullet list" onClick={exportMarkdown} />
          <ExportBtn icon="⬡" label="Export SVG" desc="Vector graphic of current view" onClick={exportSVG} />
          <ExportBtn
            icon="🖨"
            label="Print / Save PDF"
            desc="Use browser print to save as PDF"
            onClick={() => window.print()}
          />
        </Section>

        <Section title="Import">
          <p style={{ fontSize: 13, color: '#636E72', marginBottom: 12, lineHeight: 1.5 }}>
            Import a previously exported JSON file to open it as a new map.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%', padding: '10px 16px', background: '#F8F9FA',
              border: '2px dashed #DFE6E9', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, color: '#2D3436', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, transition: 'border-color 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#DFE6E9'; }}
          >
            ↑ Choose JSON file…
          </button>
        </Section>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#636E72', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
      {title}
    </div>
    {children}
  </div>
);

const ExportBtn: React.FC<{ icon: string; label: string; desc: string; onClick: () => void }> = ({ icon, label, desc, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', padding: '10px 14px', marginBottom: 8,
      background: '#F8F9FA', border: '1px solid #DFE6E9', borderRadius: 8,
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
      textAlign: 'left', transition: 'background 120ms',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = '#F0EDFF'; e.currentTarget.style.borderColor = '#6C5CE7'; }}
    onMouseLeave={e => { e.currentTarget.style.background = '#F8F9FA'; e.currentTarget.style.borderColor = '#DFE6E9'; }}
  >
    <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{icon}</span>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3436' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#636E72', marginTop: 2 }}>{desc}</div>
    </div>
  </button>
);
