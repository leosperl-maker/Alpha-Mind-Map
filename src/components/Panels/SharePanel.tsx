import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { BottomSheet } from '../common/BottomSheet';

export const SharePanel: React.FC = () => {
  const activePanel = useUIStore(s => s.activePanel);
  const setActivePanel = useUIStore(s => s.setActivePanel);
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const importMap = useMapStore(s => s.importMap);
  const setActiveMap = useMapStore(s => s.setActiveMap);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  const { isMobile } = useBreakpoint();

  if (activePanel !== 'share') return null;

  const map = maps.find(m => m.id === activeMapId);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportAMM = () => {
    if (!map) return;
    const payload = {
      format: 'alpha-mind-map',
      version: 1,
      exportedAt: new Date().toISOString(),
      map,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${map.title}.amm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAMM = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        const mapData = parsed.format === 'alpha-mind-map' ? JSON.stringify(parsed.map) : text;
        const newId = importMap(mapData);
        if (newId) {
          setActiveMap(newId);
          setActivePanel(null);
        } else {
          alert('Invalid .amm file.');
        }
      } catch {
        alert('Could not parse file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPDF = async () => {
    const canvasEl = document.querySelector('.canvas-transform') as HTMLElement | null;
    if (!canvasEl) { alert('No canvas found.'); return; }
    setPdfStatus('generating');
    try {
      const snapshot = await html2canvas(canvasEl, {
        backgroundColor: '#F8F9FA',
        scale: 1.5,
        useCORS: true,
        logging: false,
      });
      const imgData = snapshot.toDataURL('image/jpeg', 0.92);
      const pdfW = snapshot.width / 1.5;
      const pdfH = snapshot.height / 1.5;
      const orientation = pdfW > pdfH ? 'landscape' : 'portrait';
      const pdf = new jsPDF({ orientation, unit: 'px', format: [pdfW, pdfH] });
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
      pdf.save(`${map?.title || 'mind-map'}.pdf`);
      setPdfStatus('done');
      setTimeout(() => setPdfStatus('idle'), 2500);
    } catch (err) {
      console.error(err);
      alert('PDF export failed. Try "Print / Save PDF" in the Export panel.');
      setPdfStatus('idle');
    }
  };

  const panelContent = (
    <div style={{ padding: 20, overflow: 'auto' }}>
      {/* Copy link */}
      <Section title="Share">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            readOnly
            value={window.location.href}
            style={{
              flex: 1, border: '1px solid #DFE6E9', borderRadius: 6,
              padding: '7px 10px', fontSize: 12, color: '#636E72',
              background: '#F8F9FA', outline: 'none',
            }}
          />
          <button
            onClick={handleCopyLink}
            style={{
              padding: '7px 14px', background: copied ? '#00B894' : '#7C5CE7',
              color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer',
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', transition: 'background 200ms',
              minHeight: 44,
            }}
          >{copied ? '✓ Copied' : 'Copy'}</button>
        </div>
        <p style={{ fontSize: 11, color: '#636E72', margin: 0, lineHeight: 1.5 }}>
          Anyone with the link can view this page. Collaboration features coming soon.
        </p>
      </Section>

      {/* .amm format */}
      <Section title="Alpha Mind Map file (.amm)">
        <ShareBtn
          icon="⬇"
          label="Download .amm file"
          desc="Native format — re-importable, preserves all data"
          onClick={handleExportAMM}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".amm,.json"
          onChange={handleImportAMM}
          style={{ display: 'none' }}
        />
        <ShareBtn
          icon="⬆"
          label="Import .amm file"
          desc="Open a previously saved .amm or .json map"
          onClick={() => fileInputRef.current?.click()}
        />
      </Section>

      {/* PDF */}
      <Section title="Export PDF">
        <ShareBtn
          icon={pdfStatus === 'generating' ? '⟳' : pdfStatus === 'done' ? '✓' : '⬇'}
          label={pdfStatus === 'generating' ? 'Generating…' : pdfStatus === 'done' ? 'PDF saved!' : 'Download PDF'}
          desc="High-quality snapshot of the current map view"
          onClick={handleExportPDF}
          disabled={pdfStatus === 'generating'}
        />
        <ShareBtn
          icon="🖨"
          label="Print / Save PDF"
          desc="Use browser print dialog (Ctrl+P) for more options"
          onClick={() => window.print()}
        />
      </Section>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        open={activePanel === 'share'}
        onClose={() => setActivePanel(null)}
        title="Share & Export"
      >
        {panelContent}
      </BottomSheet>
    );
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
        <span style={{ fontWeight: 600, fontSize: 15, color: '#2D3436' }}>Share & Export</span>
        <button onClick={() => setActivePanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#636E72', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      </div>

      {panelContent}
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

const ShareBtn: React.FC<{ icon: string; label: string; desc: string; onClick: () => void; disabled?: boolean }> = ({ icon, label, desc, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%', padding: '10px 14px', marginBottom: 8,
      background: disabled ? '#F0F0F0' : '#F8F9FA', border: '1px solid #DFE6E9', borderRadius: 8,
      cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 12,
      textAlign: 'left', transition: 'background 120ms', opacity: disabled ? 0.6 : 1,
      minHeight: 44,
    }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = '#F0EDFF'; e.currentTarget.style.borderColor = '#7C5CE7'; } }}
    onMouseLeave={e => { if (!disabled) { e.currentTarget.style.background = '#F8F9FA'; e.currentTarget.style.borderColor = '#DFE6E9'; } }}
  >
    <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{icon}</span>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3436' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#636E72', marginTop: 2 }}>{desc}</div>
    </div>
  </button>
);
