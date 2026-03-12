import React from 'react';
import type { MindMapNode, MapStyle } from '../../types';
import { bezierPath, getStrokeDasharray } from '../../utils/bezier';
import { getNodeDimensions } from '../../utils/layout';
import { getLevelColor } from '../../utils/colors';

interface ConnectorProps {
  parent: MindMapNode;
  child: MindMapNode;
  mapStyle: MapStyle;
  themeColor: string;
  depth: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const Connector: React.FC<ConnectorProps> = ({
  parent, child, mapStyle, themeColor, depth, isSelected, onSelect,
}) => {
  const parentDims = getNodeDimensions(parent);
  const childDims = getNodeDimensions(child);

  const goingRight = child.position.x >= parent.position.x;
  const fromX = parent.position.x + (goingRight ? parentDims.w / 2 : -parentDims.w / 2);
  const fromY = parent.position.y;
  const toX = child.position.x + (goingRight ? -childDims.w / 2 : childDims.w / 2);
  const toY = child.position.y;

  const style = child.style.connectorStyle;
  const d = bezierPath({ x: fromX, y: fromY }, { x: toX, y: toY }, style);
  const dasharray = getStrokeDasharray(style);

  let stroke = child.style.connectorColor || themeColor;
  if (!child.style.connectorColor) {
    if (mapStyle === 'productive') stroke = getLevelColor(depth);
    else if (mapStyle === 'simple') stroke = '#b2bec3';
  }

  const widthMap = { thin: 1.5, normal: 2, thick: 3.5 };
  const baseWidth = widthMap[child.style.connectorWidth] ?? 2;
  const strokeWidth = isSelected ? baseWidth + 1.5 : (depth === 1 ? baseWidth + 0.5 : baseWidth);

  // Use | as separator (UUIDs don't contain |)
  const connId = `${parent.id}|${child.id}`;

  return (
    <g>
      {/* Invisible wider hit area for easier clicking */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        style={{ cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); onSelect(connId); }}
      />
      {/* Selection glow */}
      {isSelected && (
        <path
          d={d}
          fill="none"
          stroke="#6C5CE7"
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          opacity={0.2}
          style={{ pointerEvents: 'none' }}
        />
      )}
      {/* Visible connector */}
      <path
        d={d}
        fill="none"
        stroke={isSelected ? '#6C5CE7' : stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dasharray === 'none' ? undefined : dasharray}
        strokeLinecap="round"
        opacity={isSelected ? 1 : 0.85}
        style={{ pointerEvents: 'none' }}
      />
    </g>
  );
};
