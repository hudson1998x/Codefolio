export type NodeId = string;

export interface CanvasNode {
  id: NodeId;
  component: string;
  data: Record<string, any>;
  children: CanvasNode[];
}

export interface Prefab {
  id: number;
  prefabName: string;
  prefabJson: CanvasNode | CanvasNode[];
  category: string;
}