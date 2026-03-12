import React, { useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';

export const NotesPanel: React.FC = () => {
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const updateNodeNote = useMapStore(s => s.updateNodeNote);
  const { activePanel, selectedNodeId, setSelectedNode } = useUIStore();
  const [search, setSearch] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  if (activePanel !== 'notes') return null;

  const map = maps.find(m => m.id === activeMapId);
  if (!map) return null;

  const nodesWithNotes = Object.values(map.nodes).filter(n =>
    n.content.note.trim() || n.id === selectedNodeId
  );

  const filtered = search
    ? nodesWithNotes.filter(n =>
        n.content.text.toLowerCase().includes(search.toLowerCase()) ||
        n.content.note.toLowerCase().includes(search.toLowerCase())
      )
    : nodesWithNotes;

  const editingId = activeNoteId || selectedNodeId;
  const editingNode = editingId ? map.nodes[editingId] : null;

  return (
    <div
      className="slide-in-right"
      style={{
        position: 'fixed',
        top: 56,
        right: 0,
        bottom: 0,
        width: 300,
        background: '#fff',
        borderLeft: '1px solid #DFE6E9',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 30,
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #DFE6E9' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#2D3436' }}>Notes</h3>
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            border: '1px solid #DFE6E9',
            borderRadius: 6,
            fontSize: 13,
            outline: 'none',
            color: '#2D3436',
          }}
        />
      </div>

      {editingNode ? (
        /* Note Editor */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <button
              onClick={() => { setActiveNoteId(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#636E72', fontSize: 16 }}
              title="Back"
            >
              ←
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2D3436' }}>
              {editingNode.content.text || 'New node'}
            </span>
          </div>

          {/* Mini markdown toolbar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {[
              { label: 'B', action: '**text**' },
              { label: 'I', action: '_text_' },
              { label: '—', action: '\n---\n' },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => {
                  const ta = document.getElementById('note-editor') as HTMLTextAreaElement;
                  if (ta) {
                    const start = ta.selectionStart;
                    const end = ta.selectionEnd;
                    const before = editingNode.content.note.substring(0, start);
                    const selected = editingNode.content.note.substring(start, end);
                    const after = editingNode.content.note.substring(end);
                    const newText = before + item.action.replace('text', selected || 'text') + after;
                    updateNodeNote(editingNode.id, newText);
                    setTimeout(() => ta.focus(), 0);
                  }
                }}
                style={{
                  background: '#F8F9FA',
                  border: '1px solid #DFE6E9',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: item.label === 'B' ? 700 : 400,
                  fontStyle: item.label === 'I' ? 'italic' : 'normal',
                  color: '#2D3436',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <textarea
            id="note-editor"
            value={editingNode.content.note}
            onChange={e => updateNodeNote(editingNode.id, e.target.value)}
            placeholder="Write your note here... (Markdown supported)"
            style={{
              flex: 1,
              border: '1px solid #DFE6E9',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 13,
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              color: '#2D3436',
            }}
          />

          <div style={{ marginTop: 8, fontSize: 11, color: '#b2bec3' }}>
            Markdown supported: **bold**, _italic_, - list
          </div>
        </div>
      ) : (
        /* Note list */
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#b2bec3', fontSize: 13 }}>
              {search ? 'No notes match your search.' : 'Select a node to add a note.'}
            </div>
          ) : (
            filtered.map(node => (
              <button
                key={node.id}
                onClick={() => {
                  setActiveNoteId(node.id);
                  setSelectedNode(node.id);
                }}
                style={{
                  width: '100%',
                  background: selectedNodeId === node.id ? '#6C5CE710' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #DFE6E9',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3436', marginBottom: 4 }}>
                  {node.content.text || 'New node'}
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#636E72',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {node.content.note || 'No note yet — click to add'}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
