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
  isEditing: boolean;
  mapStyle: MapStyle;
  themeColor: string;
  depth: number;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onDoubleClick: (id: string) => void;
  onAddChild: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
}

const FONT_SIZE_MAP = { xs: 11, s: 12, m: 14, l: 17, xl: 21 };

export const MindNode: React.FC<MindNodeProps> = ({
  node,
  isRoot,
  isSelected,
  isEditing,
  mapStyle,
  themeColor,
  depth,
  onSelect,
  onDoubleClick,
  onAddChild,
  onDragStart,
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
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }, [node.id, updateNodeText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setEditingNode(null);
    }
    if (e.key === 'Escape') {
      setEditingNode(null);
    }
    e.stopPropagation();
  }, [setEditingNode]);

  // Determine colors based on style
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
    textColor = '#2D3436';
    borderColor = lc;
    borderWidth = 1.5;
  } else if (mapStyle === 'simple') {
    fillColor = 'transparent';
    textColor = '#2D3436';
    borderColor = 'transparent';
    borderWidth = 0;
  } else {
    // bubbles (default)
    if (isRoot) {
      fillColor = themeColor;
      textColor = '#ffffff';
      borderColor = themeColor;
      borderWidth = 0;
    } else {
      fillColor = '#ffffff';
      textColor = '#2D3436';
      borderColor = '#DFE6E9';
      borderWidth = 1.5;
    }
  }

  if (isSelected) {
    borderColor = themeColor;
    borderWidth = 2;
  }

  const shapeMap = {
    rounded: '8px',
    rectangle: '0px',
    pill: '999px',
    circle: '50%',
  };
  const borderRadius = shapeMap[node.style.shape] || '8px';

  const hasChildren = node.childrenIds.length > 0;
  const hasNote = node.content.note.trim().length > 0;

  return (
    <div
      className="node-wrapper"
      style={{ left: node.position.x, top: node.position.y }}
      onMouseEnter={() => setHoveredNode(node.id)}
      onMouseLeave={() => setHoveredNode(null)}
    >
      {/* Main node */}
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
            ? `0 0 0 2px ${hexToRgba(themeColor, 0.3)}, 0 2px 8px rgba(0,0,0,0.1)`
            : isHovered
            ? '0 2px 12px rgba(0,0,0,0.12)'
            : '0 1px 4px rgba(0,0,0,0.06)',
          cursor: isEditing ? 'text' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 14px',
          transition: 'box-shadow 120ms ease, border-color 120ms ease',
          position: 'relative',
        }}
        onClick={(e) => { if (!isEditing) onSelect(node.id, e); }}
        onDoubleClick={() => onDoubleClick(node.id)}
        onMouseDown={(e) => { if (!isEditing) onDragStart(node.id, e); }}
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
          <span
            style={{
              fontSize,
              fontWeight: node.style.fontWeight === 'bold' ? 700 : 400,
              color: textColor,
              lineHeight: 1.4,
              wordBreak: 'break-word',
              textAlign: 'center',
              whiteSpace: node.content.text ? 'pre-wrap' : 'nowrap',
              opacity: node.content.text ? 1 : 0.4,
            }}
          >
            {node.content.text || 'New node'}
          </span>
        )}

        {/* Note indicator */}
        {hasNote && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#00B894',
              border: '1.5px solid white',
            }}
            title="Has note"
          />
        )}
      </div>

      {/* Collapse/Expand indicator */}
      {hasChildren && (
        <button
          onClick={(e) => { e.stopPropagation(); toggleCollapse(node.id); }}
          style={{
            position: 'absolute',
            right: node.position.x > 0 ? -10 : 'auto',
            left: node.position.x <= 0 ? -10 : 'auto',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            border: `1.5px solid ${themeColor}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: themeColor,
            zIndex: 10,
            lineHeight: 1,
          }}
          aria-label={node.position.collapsed ? 'Expand' : 'Collapse'}
          title={node.position.collapsed ? 'Expand' : 'Collapse'}
        >
          {node.position.collapsed ? '+' : '−'}
        </button>
      )}

      {/* Add child button */}
      {(isHovered || isSelected) && !isEditing && (
        <button
          onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
          style={{
            position: 'absolute',
            right: -24,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#636E72',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            lineHeight: 1,
            zIndex: 10,
            opacity: 0.75,
            transition: 'opacity 120ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.75')}
          title="Add child node (Tab)"
          aria-label="Add child node"
        >
          +
        </button>
      )}
    </div>
  );
};
