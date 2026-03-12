import React from 'react';
import type { MindMap } from '../../types';
import { getNodeDimensions } from '../../utils/layout';
import { ALPHA_COLORS } from '../../utils/colors';

interface MinimapProps {
  map: MindMap;
  canvasW: number;
  canvasH: number;
  zoom: number;
  panX: number;
  panY: number;
}

const MINIMAP_W = 160;
const MINIMAP_H = 100;

export const Minimap: React.FC<MinimapProps> = ({ map, canvasW, canvasH, zoom, panX, panY }) => {
  const nodes = Object.values(map.nodes);
  if (nodes.length === 0) return null;

  // Compute bounding box in world coords
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const { w, h } = getNodeDimensions(n);
    minX = Math.min(minX, n.position.x - w / 2);
    minY = Math.min(minY, n.position.y - h / 2);
    maxX = Math.max(maxX, n.position.x + w / 2);
    maxY = Math.max(maxY, n.position.y + h / 2);
  }

  const worldW = maxX - minX + 100;
  const worldH = maxY - minY + 100;
  const scaleX = MINIMAP_W / worldW;
  const scaleY = MINIMAP_H / worldH;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (MINIMAP_W - worldW * scale) / 2 - minX * scale;
  const offsetY = (MINIMAP_H - worldH * scale) / 2 - minY * scale;

  // Viewport rect in world coords
  const vpLeft = -panX / zoom;
  const vpTop = -panY / zoom;
  const vpRight = vpLeft + canvasW / zoom;
  const vpBottom = vpTop + canvasH / zoom;

  const vpX = (vpLeft - minX) * scale + (MINIMAP_W - worldW * scale) / 2;
  const vpY = (vpTop - minY) * scale + (MINIMAP_H - worldH * scale) / 2;
  const vpW = (vpRight - vpLeft) * scale;
  const vpH = (vpBottom - vpTop) * scale;

  return (
    <div
      className="minimap-container"
      style={{ width: MINIMAP_W, height: MINIMAP_H, position: 'relative' }}
      title="Minimap"
    >
      <svg width={MINIMAP_W} height={MINIMAP_H}>
        {/* Node dots */}
        {nodes.map(n => {
          const { w, h } = getNodeDimensions(n);
          const nx = n.position.x * scale + offsetX;
          const ny = n.position.y * scale + offsetY;
          const nw = Math.max(4, w * scale);
          const nh = Math.max(3, h * scale);
          const fill = n.style.fillColor || (n.parentId === null ? ALPHA_COLORS.primary : '#DFE6E9');
          return (
            <rect
              key={n.id}
              x={nx - nw / 2}
              y={ny - nh / 2}
              width={nw}
              height={nh}
              rx={2}
              fill={fill}
              opacity={0.8}
            />
          );
        })}
        {/* Viewport rect */}
        <rect
          x={vpX}
          y={vpY}
          width={Math.max(8, vpW)}
          height={Math.max(6, vpH)}
          fill="none"
          stroke={ALPHA_COLORS.primary}
          strokeWidth={1.5}
          rx={2}
          opacity={0.7}
        />
      </svg>
    </div>
  );
};
