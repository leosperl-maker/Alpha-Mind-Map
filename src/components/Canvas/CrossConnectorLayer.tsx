import React from 'react';
import type { CrossConnector, MindMapNode } from '../../types';
import { getNodeDimensions } from '../../utils/layout';
import { useMapStore } from '../../store/mapStore';

interface CrossConnectorLayerProps {
  crossConnectors: CrossConnector[];
  nodes: Record<string, MindMapNode>;
}

export const CrossConnectorLayer: React.FC<CrossConnectorLayerProps> = ({ crossConnectors, nodes }) => {
  const removeCrossConnector = useMapStore(s => s.removeCrossConnector);

  return (
    <>
      {crossConnectors.map(cc => {
        const fromNode = nodes[cc.fromId];
        const toNode = nodes[cc.toId];
        if (!fromNode || !toNode) return null;

        const fromDims = getNodeDimensions(fromNode);
        const toDims = getNodeDimensions(toNode);

        const x1 = fromNode.position.x;
        const y1 = fromNode.position.y;
        const x2 = toNode.position.x;
        const y2 = toNode.position.y;

        // Midpoint control for a slightly curved arc
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 - 60;

        const d = `M ${x1 + fromDims.w / 2} ${y1} Q ${mx} ${my} ${x2 + toDims.w / 2} ${y2}`;
        const color = cc.color || '#6C5CE7';

        // Mid-point for delete button placement
        // Approximate t=0.5 on quadratic bezier
        const bx = 0.25 * (x1 + fromDims.w / 2) + 0.5 * mx + 0.25 * (x2 + toDims.w / 2);
        const by = 0.25 * y1 + 0.5 * my + 0.25 * y2;

        return (
          <g key={cc.id}>
            {/* Hit area */}
            <path d={d} fill="none" stroke="transparent" strokeWidth={12} style={{ cursor: 'pointer' }} />
            {/* Visual */}
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              strokeLinecap="round"
              opacity={0.7}
            />
            {/* Delete button at midpoint */}
            <g
              transform={`translate(${bx}, ${by})`}
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); removeCrossConnector(cc.id); }}
            >
              <circle r={8} fill="white" stroke={color} strokeWidth={1} />
              <text textAnchor="middle" dominantBaseline="middle" fontSize={10} fill={color} fontWeight="bold">×</text>
            </g>
          </g>
        );
      })}
    </>
  );
};
