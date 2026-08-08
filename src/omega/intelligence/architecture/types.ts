export interface GraphNode {
  id: string;
  label?: string;
  file_type?: string;
  source_file?: string;
  community?: number;
  norm_label?: string;
  [key: string]: any;
}

export interface GraphLink {
  relation: string;
  confidence?: string;
  source_file?: string;
  weight?: number;
  source: string;
  target: string;
  confidence_score?: number;
  [key: string]: any;
}

export interface ArchitectureGraphData {
  directed: boolean;
  multigraph: boolean;
  nodes: GraphNode[];
  links: GraphLink[];
  built_at_commit?: string;
}

export interface ArchitectureStats {
  nodes: number;
  links: number;
  directed: boolean;
  builtAtCommit?: string;
  topHubs: { id: string; degree: number; file?: string }[];
  topCoupling: { file: string; crossFileLinks: number }[];
  relationCounts: Record<string, number>;
  communityCount: number;
}

export interface ArchitectureNodeInfo {
  id: string;
  label: string;
  file: string;
  community?: number;
  degree: number;
  neighbors: { id: string; relation: string }[];
}

export interface PathFindingResult {
  found: boolean;
  path?: { from: string; to: string; relation: string }[];
  hops?: number;
}

export interface ImpactResult {
  subject: string;
  affectedNodes: { id: string; label: string; via: string; hops: number }[];
  affectedFiles: string[];
  immediateDependencies: string[];
  maxHops: number;
}
