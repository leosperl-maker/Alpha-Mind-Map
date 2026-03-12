import React, { useRef, useEffect, useCallback } from 'react';
import type { MindMapNode, MapStyle } from '../../types';
import { getNodeDimensions } from '../../utils/layout';
import { getLevelColor, hexToRgba } from '../../utils/colors';
import { useUIStore } from '../../store/uiStore';
import { useMapStore } from '../../store/mapStore';

interface MindNodeProps {
  node: MindMapNode;
  isRoot: boolean;
  isSelected: boolean;
  isMultiSelected: boolean;
  isEditing: boolean;
  mapStyle: MapStyle;
  themeColor: string;
  depth: number;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onDoubleClick: (id: string) => void;
  onAddChild: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  onContextMenu: (id: string, e: React.MouseEvent) => void;
}

const FONT_SIZE_MAP = { xs: 11, s: 12, m: 14, l: 17, xl: 21 };

export const MindNode: React.FC<MindNodeProps> = ({
  node, isRoot, isSelected, isMultiSelected, isEditing,
  mapStyle, themeColor, depth,
  onSelect, onDoubleClick, onAddChild, onDragStart, onContextMenu,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setEditingNode, setHoveredNode, hoveredNodeId } = useUIStore();
  const { updateNodeText, toggleCollapse } = useMapStore();

  const dims = getNodeDimensions(node);
  const fontSize = FONT_SIZE_MAP[node.style.fontSize] ?? 14;
  const isHovered = hoveredNodeId === node.id;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeText(node.id, e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }, [node.id, updateNodeText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setEditingNode(null); }
    if (e.key === 'Escape') setEditingNode(null);
    e.stopPropagation();
  }, [setEditingNode]);

  // Resolve colors
  let fillColor: string;
  let textColor: string;
  let borderColor: string;
  let borderWidth: number;

  if (node.style.fillColor) {
    fillColor = node.style.fillColor;
    textColor = node.style.textColor || '#ffffff';
    borderColor = node.style.borderColor || node.style.fillColor;
    borderWidth = 0;
  } else if (mapStyle === 'productive') {
    const lc = getLevelColor(depth);
    fillColor = hexToRgba(lc, 0.15);
    textColor = node.style.textColor || '#2D3436';
    borderColor = lc;
    borderWidth = 1.5;
  } else if (mapStyle === 'simple') {
    fillColor = 'transparent';
    textColor = node.style.textColor || '#2D3436';
    borderColor = 'transparent';
    borderWidth = 0;
  } else {
    if (isRoot) {
      fillColor = themeColor;
      textColor = node.style.textColor || '#ffffff';
      borderColor = themeColor;
      borderWidth = 0;
    } else {
      fillColor = '#ffffff';
      textColor = node.style.textColor || '#2D3436';
      borderColor = '#DFE6E9';
      borderWidth = 1.5;
    }
  }

  // Override text color if explicitly set (always)
  if (node.style.textColor) textColor = node.style.textColor;

  if (isSelected || isMultiSelected) {
    borderColor = isMultiSelected ? '#00B894' : themeColor;
    borderWidth = 2;
  }

  const shapeMap = { rounded: '8px', rectangle: '0px', pill: '999px', circle: '50%' };
  const borderRadius = shapeMap[node.style.shape] || '8px';
  const hasChildren = node.childrenIds.length > 0;
  const hasNote = node.content.note.trim().length > 0;
  const hasAttachments = node.content.attachments.length > 0;

  return (
    <div
      className="node-wrapper"
      style={{ left: node.position.x, top: node.position.y }}
      onMouseEnter={() => setHoveredNode(node.id)}
      onMouseLeave={() => setHoveredNode(null)}
    >
      <div
        role="button"
        aria-label={node.content.text || 'New node'}
        aria-selected={isSelected}
        style={{
          width: dims.w,
          minHeight: dims.h,
          backgroundColor: fillColor,
          border: `${borderWidth}px solid ${borderColor}`,
          borderRadius,
          boxShadow: isSelected
            ? `0 0 0 2px ${hexToRgba(themeColor, 0.3)}, 0 2px 10px rgba(0,0,0,0.12)`
            : isMultiSelected
            ? `0 0 0 2px rgba(0,184,148,0.4), 0 2px 8px rgba(0,0,0,0.1)`
            : isHovered
            ? '0 3px 14px rgba(0,0,0,0.14)'
            : '0 1px 4px rgba(0,0,0,0.06)',
          cursor: isEditing ? 'text' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 14px',
          transition: 'box-shadow 120ms ease, border-color 120ms ease',
          position: 'relative',
          userSelect: 'none',
        }}
        onClick={(e) => { if (!isEditing) onSelect(node.id, e); }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node.id); }}
        onMouseDown={(e) => { if (!isEditing) { e.stopPropagation(); onDragStart(node.id, e); } }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(node.id, e); }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="node-edit-input"
            value={node.content.text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setEditingNode(null)}
            rows={1}
            style={{
              fontSize,
              fontWeight: node.style.fontWeight === 'bold' ? 700 : 400,
              color: textColor,
              minHeight: fontSize * 1.4,
            }}
          />
        ) : (
          <span style={{
            fontSize,
            fontWeight: node.style.fontWeight === 'bold' ? 700 : 400,
            color: textColor,
            lineHeight: 1.4,
            wordBreak: 'break-word',
            textAlign: 'center',
            whiteSpace: node.content.text ? 'pre-wrap' : 'nowrap',
            opacity: node.content.text ? 1 : 0.4,
          }}>
            {node.content.text || 'New node'}
          </span>
        )}

        {/* Badges */}
        <div style={{ position: 'absolute', top: -4, right: -4, display: 'flex', gap: 3 }}>
          {hasNote && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00B894', border: '1.5px solid white' }} title="Has note" />
          )}
          {hasAttachments && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FDCB6E', border: '1.5px solid white' }} title="Has attachments" />
          )}
        </div>
      </div>

      {/* Collapse/Expand */}
      {hasChildren && (
        <button
          onClick={(e) => { e.stopPropagation(); toggleCollapse(node.id); }}
          onDoubleClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            right: node.position.side !== 'left' ? -10 : 'auto',
            left: node.position.side === 'left' ? -10 : 'auto',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff', border: `1.5px solid ${themeColor}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: themeColor, zIndex: 10, lineHeight: 1,
          }}
          onMouseDown={e => e.stopPropagation()}
          aria-label={node.position.collapsed ? 'Expand' : 'Collapse'}
        >
          {node.position.collapsed ? '+' : '−'}
        </button>
      )}

      {/* Add child button */}
      {(isHovered || isSelected) && !isEditing && !node.position.collapsed && (
        <button
          onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
          onDoubleClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            right: node.position.side !== 'left' ? -26 : 'auto',
            left: node.position.side === 'left' ? -26 : 'auto',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 22, height: 22, borderRadius: '50%',
            background: themeColor, border: 'none', cursor: 'pointer',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, lineHeight: 1, zIndex: 10, opacity: 0.8,
            transition: 'opacity 120ms, transform 120ms',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
          title="Add child node (Tab)"
          aria-label="Add child node"
        >
          +
        </button>
      )}
    </div>
  );
};
