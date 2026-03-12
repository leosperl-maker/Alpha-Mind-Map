import React, { useRef } from 'react';
import type { StickyNote as StickyNoteType } from '../../types';
import { useMapStore } from '../../store/mapStore';

interface StickyNoteProps {
  note: StickyNoteType;
}

export const StickyNote: React.FC<StickyNoteProps> = ({ note }) => {
  const { updateStickyNote, deleteStickyNote, moveStickyNote } = useMapStore();
  const dragRef = useRef<{ startX: number; startY: number; noteX: number; noteY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startY: e.clientY, noteX: note.x, noteY: note.y };

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      moveStickyNote(note.id, dragRef.current.noteX + dx, dragRef.current.noteY + dy);
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      className="sticky-note"
      style={{
        left: note.x,
        top: note.y,
        width: 180,
        minHeight: 140,
        backgroundColor: note.color,
        borderRadius: 2,
        boxShadow: '2px 4px 12px rgba(0,0,0,0.15)',
        padding: '8px',
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 5,
      }}
      onMouseDown={handleMouseDown}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <button
          onClick={(e) => { e.stopPropagation(); deleteStickyNote(note.id); }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 2px',
            fontSize: 14,
            color: '#636E72',
            lineHeight: 1,
          }}
          title="Delete sticky note"
        >
          ×
        </button>
      </div>
      <textarea
        value={note.text}
        onChange={(e) => updateStickyNote(note.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder="Type your note..."
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: 'inherit',
          fontSize: 13,
          color: '#2D3436',
          lineHeight: 1.5,
          cursor: 'text',
        }}
      />
    </div>
  );
};
