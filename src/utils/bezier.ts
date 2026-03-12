export interface Point {
  x: number;
  y: number;
}

export function bezierPath(
  from: Point,
  to: Point,
  style: 'curved' | 'straight' | 'dashed' | 'dotted'
): string {
  if (style === 'straight') {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  const dx = to.x - from.x;
  const cx = from.x + dx * 0.5;

  return `M ${from.x} ${from.y} C ${cx} ${from.y}, ${cx} ${to.y}, ${to.x} ${to.y}`;
}

export function getStrokeDasharray(
  style: 'curved' | 'straight' | 'dashed' | 'dotted'
): string {
  if (style === 'dashed') return '8 4';
  if (style === 'dotted') return '2 4';
  return 'none';
}
