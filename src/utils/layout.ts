import type { MindMapNode, MapDirection } from '../types';

const H_GAP = 180;
const V_GAP = 60;

interface LayoutResult {
  id: string;
  x: number;
  y: number;
}


function getSubtreeHeight(
  nodeId: string,
  nodes: Record<string, MindMapNode>
): number {
  const node = nodes[nodeId];
  if (!node || node.position.collapsed || node.childrenIds.length === 0) {
    return 1;
  }
  return node.childrenIds.reduce(
    (sum, cid) => sum + getSubtreeHeight(cid, nodes),
    0
  );
}

function layoutSubtree(
  nodeId: string,
  nodes: Record<string, MindMapNode>,
  x: number,
  y: number,
  direction: 1 | -1,
  results: LayoutResult[]
): number {
  const node = nodes[nodeId];
  if (!node) return y;

  results.push({ id: nodeId, x, y });

  if (node.position.collapsed || node.childrenIds.length === 0) return y;

  const childX = x + direction * H_GAP;
  const totalHeight = getSubtreeHeight(nodeId, nodes) - 1; // subtract self

  let childY = y - ((totalHeight - 1) * V_GAP) / 2;

  for (const childId of node.childrenIds) {
    const subtreeH = getSubtreeHeight(childId, nodes);
    const childCenter = childY + ((subtreeH - 1) * V_GAP) / 2;
    layoutSubtree(childId, nodes, childX, childCenter, direction, results);
    childY += subtreeH * V_GAP;
  }

  return y;
}

export function computeRadialLayout(
  rootId: string,
  nodes: Record<string, MindMapNode>,
  direction: MapDirection
): LayoutResult[] {
  const root = nodes[rootId];
  if (!root) return [];

  const results: LayoutResult[] = [];

  if (direction === 'left-right') {
    layoutSubtree(rootId, nodes, 0, 0, 1, results);
    return results;
  }

  if (direction === 'right-left') {
    layoutSubtree(rootId, nodes, 0, 0, -1, results);
    return results;
  }

  // Default: split children left/right
  const children = root.childrenIds;
  results.push({ id: rootId, x: 0, y: 0 });

  if (children.length === 0) return results;

  const rightChildren = children.filter((_, i) => i % 2 === 0);
  const leftChildren = children.filter((_, i) => i % 2 !== 0);

  // Layout right side
  const rightTotal = rightChildren.reduce(
    (s, cid) => s + getSubtreeHeight(cid, nodes),
    0
  );
  let ry = -((rightTotal - 1) * V_GAP) / 2;
  for (const cid of rightChildren) {
    const h = getSubtreeHeight(cid, nodes);
    const cy = ry + ((h - 1) * V_GAP) / 2;
    layoutSubtree(cid, nodes, H_GAP, cy, 1, results);
    ry += h * V_GAP;
  }

  // Layout left side
  const leftTotal = leftChildren.reduce(
    (s, cid) => s + getSubtreeHeight(cid, nodes),
    0
  );
  let ly = -((leftTotal - 1) * V_GAP) / 2;
  for (const cid of leftChildren) {
    const h = getSubtreeHeight(cid, nodes);
    const cy = ly + ((h - 1) * V_GAP) / 2;
    layoutSubtree(cid, nodes, -H_GAP, cy, -1, results);
    ly += h * V_GAP;
  }

  return results;
}

export function getNodeDimensions(node: MindMapNode): { w: number; h: number } {
  const text = node.content.text || 'New node';
  const charCount = text.length;
  const sizeMap = { xs: 11, s: 13, m: 15, l: 18, xl: 22 };
  const fontSize = sizeMap[node.style.fontSize] || 15;

  const minW = 80;
  const maxW = 240;
  const estimatedW = Math.min(maxW, Math.max(minW, charCount * fontSize * 0.62 + 32));
  const lines = Math.ceil((charCount * fontSize * 0.62) / (maxW - 32)) || 1;
  const h = lines * (fontSize * 1.4) + 24;

  return { w: estimatedW, h: Math.max(36, h) };
}
