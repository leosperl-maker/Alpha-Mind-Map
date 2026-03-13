import React, { useState, useRef } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import type { NodeStyle, FontSize, NodeShape, ConnectorStyle, NodeMedia } from '../../types';
import { NODE_PALETTE, ALPHA_COLORS } from '../../utils/colors';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { getAISettings, generateBranches, improveNodeText } from '../../utils/aiService';
import { v4 as uuid } from 'uuid';

export const NodeToolbar: React.FC = () => {
  const selectedNodeId = useUIStore(s => s.selectedNodeId);
  const editingNodeId = useUIStore(s => s.editingNodeId);
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const updateNodeStyle = useMapStore(s => s.updateNodeStyle);
  const updateNodeMedia = useMapStore(s => s.updateNodeMedia);
  const toggleNodeStar = useMapStore(s => s.toggleNodeStar);
  const deleteNode = useMapStore(s => s.deleteNode);
  const colorBranch = useMapStore(s => s.colorBranch);
  const { setSelectedNode, setAISuggestions, setAILoading, aiLoading, setAIImproveOptions, aiImproveOptions } = useUIStore();
  const { isMobile } = useBreakpoint();

  const [showColorPicker, setShowColorPicker] = useState<'fill' | 'border' | 'text' | 'branch' | null>(null);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!selectedNodeId || editingNodeId) return null;

  const map = maps.find(m => m.id === activeMapId);
  if (!map) return null;

  const node = map.nodes[selectedNodeId];
  if (!node) return null;

  const isRoot = (map.rootNodeIds || [map.rootNodeId]).includes(selectedNodeId);
  const style = node.style;
  const isStarred = node.content.isStarred;

  const set = (s: Partial<NodeStyle>) => updateNodeStyle(selectedNodeId, s);

  const fontSizes: FontSize[] = ['xs', 's', 'm', 'l', 'xl'];
  const shapes: { key: NodeShape; label: string }[] = [
    { key: 'rounded', label: '▭' },
    { key: 'pill', label: '⬭' },
    { key: 'circle', label: '○' },
    { key: 'rectangle', label: '▬' },
  ];
  const connectors: { key: ConnectorStyle; label: string }[] = [
    { key: 'curved', label: '⌒' },
    { key: 'straight', label: '—' },
    { key: 'dashed', label: '- -' },
    { key: 'dotted', label: '···' },
  ];

  // ── AI handlers ──────────────────────────────────────────────────────────────

  const handleAIBranches = async () => {
    const aiSettings = getAISettings();
    if (!aiSettings.apiKey) {
      alert('Clé API Anthropic non configurée. Allez dans Paramètres > IA pour la configurer.');
      return;
    }
    setShowMediaMenu(false);
    setAILoading(true);
    try {
      const contextNodes = Object.values(map.nodes)
        .filter(n => n.id !== selectedNodeId)
        .map(n => n.content.text)
        .filter(Boolean)
        .slice(0, 15);
      const suggestions = await generateBranches(
        node.content.text || 'nœud',
        contextNodes,
        aiSettings.apiKey,
        aiSettings.model,
        aiSettings.language
      );
      setAISuggestions({
        parentId: selectedNodeId,
        items: suggestions.map(text => ({ id: uuid(), text })),
      });
    } catch (err) {
      alert('Erreur IA : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAILoading(false);
    }
  };

  const handleAIImprove = async () => {
    const aiSettings = getAISettings();
    if (!aiSettings.apiKey) {
      alert('Clé API Anthropic non configurée. Allez dans Paramètres > IA pour la configurer.');
      return;
    }
    if (!node.content.text) return;
    setAILoading(true);
    try {
      const options = await improveNodeText(
        node.content.text,
        aiSettings.apiKey,
        aiSettings.model,
        aiSettings.language
      );
      setAIImproveOptions(options);
    } catch (err) {
      alert('Erreur IA : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAILoading(false);
    }
  };

  // ── Media handlers ────────────────────────────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const existing = node.content.media || {};
      const media: NodeMedia = {
        ...existing,
        image: { type: 'base64', data: dataUrl },
      };
      updateNodeMedia(selectedNodeId, media);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowMediaMenu(false);
  };

  const handleLinkSubmit = () => {
    if (!linkUrl) return;
    try {
      const url = new URL(linkUrl.startsWith('http') ? linkUrl : 'https://' + linkUrl);
      const existing = node.content.media || {};
      const media: NodeMedia = {
        ...existing,
        link: {
          url: url.toString(),
          title: linkTitle || url.hostname,
          favicon: `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=16`,
        },
      };
      updateNodeMedia(selectedNodeId, media);
    } catch {
      alert('URL invalide');
      return;
    }
    setLinkUrl('');
    setLinkTitle('');
    setShowLinkInput(false);
    setShowMediaMenu(false);
  };

  const toolbarContent = (
    <>
      {/* Star */}
      <button
        onClick={() => toggleNodeStar(selectedNodeId)}
        style={{
          ...toolBtnStyle,
          color: isStarred ? '#FDCB6E' : '#636E72',
          fontSize: 16, padding: isMobile ? '8px' : '2px 6px', borderRadius: 4,
          minWidth: isMobile ? 44 : undefined, minHeight: isMobile ? 44 : undefined,
        }}
        title={isStarred ? 'Retirer des favoris' : 'Marquer comme important'}
      >{isStarred ? '★' : '☆'}</button>

      <Divider />

      {/* Fill color */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowColorPicker(showColorPicker === 'fill' ? null : 'fill')}
          style={{
            ...toolBtnStyle,
            background: style.fillColor || '#F8F9FA',
            border: `2px solid ${style.fillColor || '#DFE6E9'}`,
            width: isMobile ? 36 : 24, height: isMobile ? 36 : 24, borderRadius: 4,
          }}
          title="Fill color"
          aria-label="Fill color"
        />
        {showColorPicker === 'fill' && (
          <ColorPicker
            onSelect={c => { set({ fillColor: c, textColor: '#fff' }); setShowColorPicker(null); }}
            onClear={() => { set({ fillColor: null, textColor: null }); setShowColorPicker(null); }}
            onClose={() => setShowColorPicker(null)}
            above={isMobile}
          />
        )}
      </div>

      {/* Border color */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowColorPicker(showColorPicker === 'border' ? null : 'border')}
          style={{
            ...toolBtnStyle,
            background: '#fff',
            border: `3px solid ${style.borderColor || '#DFE6E9'}`,
            width: isMobile ? 36 : 24, height: isMobile ? 36 : 24, borderRadius: 4,
          }}
          title="Border color"
          aria-label="Border color"
        />
        {showColorPicker === 'border' && (
          <ColorPicker
            onSelect={c => { set({ borderColor: c }); setShowColorPicker(null); }}
            onClear={() => { set({ borderColor: null }); setShowColorPicker(null); }}
            onClose={() => setShowColorPicker(null)}
            above={isMobile}
          />
        )}
      </div>

      {/* Text color */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')}
          style={{
            ...toolBtnStyle,
            background: 'none',
            border: `2px solid ${style.textColor || '#DFE6E9'}`,
            width: isMobile ? 36 : 24, height: isMobile ? 36 : 24, borderRadius: 4,
            fontSize: 12, fontWeight: 700,
            color: style.textColor || '#2D3436',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Text color"
          aria-label="Text color"
        >T</button>
        {showColorPicker === 'text' && (
          <ColorPicker
            onSelect={c => { set({ textColor: c }); setShowColorPicker(null); }}
            onClear={() => { set({ textColor: null }); setShowColorPicker(null); }}
            onClose={() => setShowColorPicker(null)}
            above={isMobile}
          />
        )}
      </div>

      <Divider />

      {/* Shape */}
      {shapes.map(s => (
        <button
          key={s.key}
          onClick={() => set({ shape: s.key })}
          style={{
            ...toolBtnStyle,
            background: style.shape === s.key ? ALPHA_COLORS.primary : 'transparent',
            color: style.shape === s.key ? '#fff' : '#636E72',
            fontSize: 13, padding: isMobile ? '8px' : '3px 8px', borderRadius: 4,
            minWidth: isMobile ? 44 : undefined, minHeight: isMobile ? 44 : undefined,
          }}
          title={s.key}
        >{s.label}</button>
      ))}

      <Divider />

      {/* Font size */}
      {fontSizes.map(fs => (
        <button
          key={fs}
          onClick={() => set({ fontSize: fs })}
          style={{
            ...toolBtnStyle,
            background: style.fontSize === fs ? ALPHA_COLORS.primary : 'transparent',
            color: style.fontSize === fs ? '#fff' : '#636E72',
            fontSize: fs === 'xs' ? 9 : fs === 's' ? 11 : fs === 'm' ? 13 : fs === 'l' ? 15 : 18,
            padding: isMobile ? '8px' : '2px 5px', borderRadius: 4,
            minWidth: isMobile ? 44 : 22, minHeight: isMobile ? 44 : undefined,
          }}
          title={`Font size: ${fs.toUpperCase()}`}
        >A</button>
      ))}

      {/* Bold */}
      <button
        onClick={() => set({ fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' })}
        style={{
          ...toolBtnStyle,
          background: style.fontWeight === 'bold' ? ALPHA_COLORS.primary : 'transparent',
          color: style.fontWeight === 'bold' ? '#fff' : '#636E72',
          fontWeight: 700, padding: isMobile ? '8px 12px' : '2px 8px', borderRadius: 4,
          minWidth: isMobile ? 44 : undefined, minHeight: isMobile ? 44 : undefined,
        }}
        title="Bold"
      >B</button>

      <Divider />

      {/* Connector style */}
      {connectors.map(c => (
        <button
          key={c.key}
          onClick={() => set({ connectorStyle: c.key })}
          style={{
            ...toolBtnStyle,
            background: style.connectorStyle === c.key ? ALPHA_COLORS.primary : 'transparent',
            color: style.connectorStyle === c.key ? '#fff' : '#636E72',
            fontSize: 12, padding: isMobile ? '8px' : '2px 6px', borderRadius: 4,
            minWidth: isMobile ? 44 : undefined, minHeight: isMobile ? 44 : undefined,
          }}
          title={c.key}
        >{c.label}</button>
      ))}

      <Divider />

      {/* Color branch */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowColorPicker(showColorPicker === 'branch' ? null : 'branch')}
          style={{
            ...toolBtnStyle,
            background: 'transparent',
            color: '#636E72',
            fontSize: 14, padding: isMobile ? '8px' : '2px 6px', borderRadius: 4,
            border: '1px solid #DFE6E9',
            minWidth: isMobile ? 44 : undefined, minHeight: isMobile ? 44 : undefined,
          }}
          title="Color branch"
        >🎨</button>
        {showColorPicker === 'branch' && (
          <BranchColorPicker
            onSelect={c => { colorBranch(selectedNodeId, c); setShowColorPicker(null); }}
            onClose={() => setShowColorPicker(null)}
            above={isMobile}
          />
        )}
      </div>

      <Divider />

      {/* Media menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setShowMediaMenu(!showMediaMenu); setShowColorPicker(null); }}
          style={{
            ...toolBtnStyle,
            background: 'transparent', color: '#636E72',
            fontSize: 14, padding: isMobile ? '8px' : '2px 6px', borderRadius: 4,
            border: '1px solid #DFE6E9',
            minWidth: isMobile ? 44 : undefined, minHeight: isMobile ? 44 : undefined,
          }}
          title="Ajouter image / lien"
        >🖼</button>

        {showMediaMenu && (
          <div
            className="panel-enter"
            style={{
              position: 'absolute',
              ...(isMobile ? { bottom: '110%' } : { top: '110%' }),
              left: 0,
              background: '#fff', border: '1px solid #DFE6E9',
              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 60, minWidth: 200, overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Upload image */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={mediaMenuItemStyle}
            >
              <span>📁</span> Uploader une image
            </button>
            {/* Image URL */}
            <button
              onClick={() => {
                const url = prompt('URL de l\'image :');
                if (!url) return;
                const existing = node.content.media || {};
                updateNodeMedia(selectedNodeId, { ...existing, image: { type: 'url', url } });
                setShowMediaMenu(false);
              }}
              style={mediaMenuItemStyle}
            >
              <span>🔗</span> Coller une URL d'image
            </button>
            {/* Add link */}
            <button
              onClick={() => setShowLinkInput(!showLinkInput)}
              style={mediaMenuItemStyle}
            >
              <span>🌐</span> Ajouter un lien
            </button>
            {showLinkInput && (
              <div style={{ padding: '8px 12px', borderTop: '1px solid #F0F0F0' }}>
                <input
                  type="text"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleLinkSubmit(); }}
                  style={{ width: '100%', padding: '5px 8px', border: '1px solid #DFE6E9', borderRadius: 5, fontSize: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 4 }}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Titre (optionnel)"
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', border: '1px solid #DFE6E9', borderRadius: 5, fontSize: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 6 }}
                />
                <button
                  onClick={handleLinkSubmit}
                  style={{ background: ALPHA_COLORS.primary, color: '#fff', border: 'none', borderRadius: 5, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}
                >Ajouter</button>
              </div>
            )}
            {/* Remove media */}
            {(node.content.media?.image || node.content.media?.link) && (
              <>
                <div style={{ height: 1, background: '#F0F0F0' }} />
                <button
                  onClick={() => { updateNodeMedia(selectedNodeId, null); setShowMediaMenu(false); }}
                  style={{ ...mediaMenuItemStyle, color: '#E17055' }}
                >
                  <span>🗑</span> Supprimer le média
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.gif,.webp,image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      {/* AI Branches */}
      <button
        onClick={handleAIBranches}
        disabled={aiLoading}
        style={{
          ...toolBtnStyle,
          background: aiLoading ? '#F8F9FA' : 'transparent',
          color: aiLoading ? '#b2bec3' : '#6C5CE7',
          fontSize: 14, padding: isMobile ? '8px' : '2px 6px', borderRadius: 4,
          border: '1px solid #DFE6E9',
          minWidth: isMobile ? 44 : undefined, minHeight: isMobile ? 44 : undefined,
        }}
        title="Générer des sous-branches avec l'IA (✨)"
      >{aiLoading ? '⟳' : '✨'}</button>

      {/* AI Improve */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={handleAIImprove}
          disabled={aiLoading || !node.content.text}
          style={{
            ...toolBtnStyle,
            background: 'transparent', color: '#6C5CE7',
            fontSize: 12, padding: isMobile ? '8px' : '2px 6px', borderRadius: 4,
            border: '1px solid #DFE6E9', fontWeight: 600,
            minWidth: isMobile ? 44 : undefined, minHeight: isMobile ? 44 : undefined,
          }}
          title="Améliorer le texte avec l'IA"
        >✦</button>
        {aiImproveOptions && (
          <div
            className="panel-enter"
            style={{
              position: 'absolute',
              ...(isMobile ? { bottom: '110%' } : { top: '110%' }),
              left: 0,
              background: '#fff', border: '1px solid #DFE6E9',
              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 60, minWidth: 220, overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '8px 12px', fontSize: 11, color: '#636E72', fontWeight: 700, borderBottom: '1px solid #F0F0F0' }}>
              ✨ Suggestions IA
            </div>
            {aiImproveOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  const { updateNodeText } = useMapStore.getState();
                  updateNodeText(selectedNodeId, opt);
                  setAIImproveOptions(null);
                }}
                style={mediaMenuItemStyle}
              >{opt}</button>
            ))}
            <button onClick={() => setAIImproveOptions(null)} style={{ ...mediaMenuItemStyle, color: '#636E72', fontSize: 11 }}>Annuler</button>
          </div>
        )}
      </div>

      {!isRoot && (
        <>
          <Divider />
          <button
            onClick={() => { deleteNode(selectedNodeId); setSelectedNode(null); }}
            style={{
              ...toolBtnStyle, color: '#E17055', padding: isMobile ? '8px 12px' : '2px 8px',
              borderRadius: 4, fontSize: 16,
              minWidth: isMobile ? 44 : undefined, minHeight: isMobile ? 44 : undefined,
            }}
            title="Delete node (Delete)"
            aria-label="Delete node"
          >🗑</button>
        </>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div
        className="panel-enter"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #DFE6E9',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          padding: '6px 8px',
          gap: 4,
          zIndex: 40,
          flexWrap: 'nowrap',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}
        onClick={e => e.stopPropagation()}
      >
        {toolbarContent}
      </div>
    );
  }

  return (
    <div
      className="panel-enter"
      style={{
        position: 'fixed',
        top: 68,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#fff',
        border: '1px solid #DFE6E9',
        borderRadius: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        padding: '6px 10px',
        gap: 6,
        zIndex: 40,
        flexWrap: 'wrap',
      }}
      onClick={e => e.stopPropagation()}
    >
      {toolbarContent}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const ColorPicker: React.FC<{
  onSelect: (c: string) => void;
  onClear: () => void;
  onClose: () => void;
  above?: boolean;
}> = ({ onSelect, onClear, onClose, above }) => (
  <div
    className="panel-enter"
    style={{
      position: 'absolute',
      ...(above ? { bottom: '110%' } : { top: '110%' }),
      left: 0,
      background: '#fff', border: '1px solid #DFE6E9',
      borderRadius: 8, padding: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      zIndex: 50, display: 'grid',
      gridTemplateColumns: 'repeat(5, 20px)', gap: 4,
    }}
    onClick={e => e.stopPropagation()}
  >
    {NODE_PALETTE.map(c => (
      <button
        key={c}
        onClick={() => onSelect(c)}
        style={{ width: 20, height: 20, borderRadius: 4, background: c, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', padding: 0 }}
        title={c}
        aria-label={c}
      />
    ))}
    <button
      onClick={onClear}
      style={{ width: 20, height: 20, borderRadius: 4, background: '#F8F9FA', border: '1px dashed #DFE6E9', cursor: 'pointer', fontSize: 10, color: '#636E72', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
      title="Clear"
    >✕</button>
    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #DFE6E9', paddingTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
      <button onClick={onClose} style={{ fontSize: 10, color: '#636E72', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
    </div>
  </div>
);

const BranchColorPicker: React.FC<{
  onSelect: (c: string) => void;
  onClose: () => void;
  above?: boolean;
}> = ({ onSelect, onClose, above }) => (
  <div
    className="panel-enter"
    style={{
      position: 'absolute',
      ...(above ? { bottom: '110%' } : { top: '110%' }),
      left: 0,
      background: '#fff', border: '1px solid #DFE6E9',
      borderRadius: 8, padding: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      zIndex: 50, display: 'grid',
      gridTemplateColumns: 'repeat(5, 20px)', gap: 4,
    }}
    onClick={e => e.stopPropagation()}
  >
    <div style={{ gridColumn: '1 / -1', fontSize: 10, color: '#636E72', marginBottom: 4 }}>Color entire branch</div>
    {NODE_PALETTE.map(c => (
      <button
        key={c}
        onClick={() => onSelect(c)}
        style={{ width: 20, height: 20, borderRadius: 4, background: c, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', padding: 0 }}
      />
    ))}
    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #DFE6E9', paddingTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
      <button onClick={onClose} style={{ fontSize: 10, color: '#636E72', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
    </div>
  </div>
);

const Divider: React.FC = () => (
  <div style={{ width: 1, height: 20, background: '#DFE6E9', margin: '0 2px' }} />
);

const toolBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 100ms',
};

const mediaMenuItemStyle: React.CSSProperties = {
  width: '100%', background: 'none', border: 'none',
  padding: '9px 14px', fontSize: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 8,
  color: '#2D3436', textAlign: 'left',
};
