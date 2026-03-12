export interface NodeAttachment {
  type: 'image' | 'file' | 'link' | 'video';
  url: string;
  name: string;
  thumbnail?: string;
}

export interface NodeComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  timestamp: string;
  reactions: { emoji: string; userId: string }[];
}

export type ConnectorStyle = 'curved' | 'straight' | 'dashed' | 'dotted';
export type ConnectorWidth = 'thin' | 'normal' | 'thick';
export type NodeShape = 'rounded' | 'rectangle' | 'pill' | 'circle';
export type FontSize = 'xs' | 's' | 'm' | 'l' | 'xl';

export interface NodeStyle {
  fillColor: string | null;
  borderColor: string | null;
  textColor: string | null;
  fontSize: FontSize;
  fontWeight: 'normal' | 'bold';
  shape: NodeShape;
  connectorStyle: ConnectorStyle;
  connectorColor: string | null;
  connectorWidth: ConnectorWidth;
}

export interface NodeContent {
  text: string;
  note: string;
  attachments: NodeAttachment[];
}

export interface NodePosition {
  x: number;
  y: number;
  collapsed: boolean;
  side?: 'left' | 'right'; // for root-level children in default layout
  manuallyPositioned?: boolean; // true when user dragged the node manually
}

export interface MindMapNode {
  id: string;
  parentId: string | null;
  childrenIds: string[];
  content: NodeContent;
  style: NodeStyle;
  position: NodePosition;
  comments: NodeComment[];
  sequenceLabel: string | null;
}

export type MapLayout = 'standard' | 'orgchart' | 'fishbone' | 'argument';
export type MapDirection = 'default' | 'left-right' | 'top-bottom' | 'right-left';
export type MapStyle = 'bubbles' | 'simple' | 'productive';

export interface MapSettings {
  layout: MapLayout;
  direction: MapDirection;
  style: MapStyle;
  themeColor: string;
}

export interface StickyNote {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  width: number;
  height: number;
}

export interface MindMap {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  isStarred: boolean;
  tags: string[];
  settings: MapSettings;
  rootNodeId: string;
  rootNodeIds: string[]; // support for multiple root nodes
  nodes: Record<string, MindMapNode>;
  stickyNotes: StickyNote[];
}

export interface HistoryEntry {
  nodes: Record<string, MindMapNode>;
  stickyNotes: StickyNote[];
  rootNodeIds: string[];
}
