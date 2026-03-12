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
}

export const Connector: React.FC<ConnectorProps> = ({ parent, child, mapStyle, themeColor, depth }) => {
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

  let stroke = themeColor;
  if (mapStyle === 'productive') {
    stroke = getLevelColor(depth);
  }
  if (mapStyle === 'simple') {
    stroke = '#b2bec3';
  }

  const strokeWidth = depth === 1 ? 2.5 : depth === 2 ? 2 : 1.5;

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={dasharray === 'none' ? undefined : dasharray}
      strokeLinecap="round"
      opacity={0.85}
    />
  );
};
