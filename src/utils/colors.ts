export const ALPHA_COLORS = {
  primary: '#6C5CE7',
  primaryDark: '#5A4BD1',
  secondary: '#00B894',
  accent: '#FDCB6E',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  border: '#DFE6E9',
  danger: '#E17055',
};

export const NODE_PALETTE = [
  '#E17055', // red
  '#FDCB6E', // yellow
  '#00B894', // green
  '#00CEC9', // cyan
  '#6C5CE7', // violet
  '#A29BFE', // light violet
  '#FD79A8', // pink
  '#74B9FF', // light blue
  '#2D3436', // dark
  '#636E72', // gray
];

export const STICKY_COLORS = [
  '#FFEAA7', // yellow
  '#DFE6E9', // light gray
  '#A8E6CF', // mint
  '#FFB3BA', // pink
  '#BAE1FF', // baby blue
];

// Level-based colors for "productive" style
export const LEVEL_COLORS = [
  '#6C5CE7', // root
  '#00B894', // level 1
  '#FDCB6E', // level 2
  '#E17055', // level 3
  '#74B9FF', // level 4+
];

export function getLevelColor(depth: number): string {
  return LEVEL_COLORS[Math.min(depth, LEVEL_COLORS.length - 1)];
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
