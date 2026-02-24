import { create } from "zustand";
import type { Edge, Node, Connection, NodeChange, EdgeChange } from "@xyflow/react";
import type { FlowData, ProcessData } from "@/types/flows";
import { useProjectsStore } from "@/state/projects";
import { debounce } from "@/lib/utils";

// Map the old stage types to column positions
export const STAGE_COLUMNS: Record<ProcessData["stage"], number> = {
  material: 0, production: 1, distribution: 2, use: 3, eol: 4,
};
export const COLUMN_WIDTH = 280; // px
export function snapToStageX(stage: ProcessData["stage"]) {
  return 80 + STAGE_COLUMNS[stage] * COLUMN_WIDTH;
}

export interface GraphState {
  nodes: Node<ProcessData>[];
  edges: Edge<FlowData>[];
  addProcess(): Node<ProcessData>;
  onNodesChange(changes: NodeChange[]): void;
  onEdgesChange(changes: EdgeChange[]): void;
  onConnect(connection: Connection): void;
  setNodes(nodes: Node<ProcessData>[]): void;
  setEdges(edges: Edge<FlowData>[]): void;
  save(): void;
  load(): void;
  clear(): void;
}

// Schema version for data storage
const STORAGE_VERSION = 1;

// Get highest node ID from nodes array
function getHighestNodeId(nodes: Node[]): number {
  return Math.max(0, ...nodes.map(n => {
    const num = parseInt(n.id.replace(/\D/g, ''));
    return isNaN(num) ? 0 : num;
  }));
}

function getStorageKey(projectId: string | null) {
  return projectId ? `flowState_${projectId}` : "flowState_default";
}

// Generate a stable edge ID from source and target
function generateEdgeId(source: string, sourceHandle: string | null | undefined, target: string, targetHandle: string | null | undefined): string {
  return `e_${source}${sourceHandle || ''}_${target}${targetHandle || ''}`;
}

// Validate node data structure
function isValidNode(node: any): node is Node<ProcessData> {
  try {
    return (
      typeof node === 'object' &&
      node !== null &&
      // Basic node properties
      typeof node.id === 'string' &&
      typeof node.type === 'string' &&
      // Position
      typeof node.position === 'object' &&
      typeof node.position.x === 'number' &&
      typeof node.position.y === 'number' &&
      // Data
      typeof node.data === 'object' &&
      node.data !== null &&
      typeof node.data.title === 'string' &&
      typeof node.data.stage === 'string' &&
      // Elementary flows
      (!node.data.elementary || (
        typeof node.data.elementary === 'object' &&
        (!node.data.elementary.inflows || Array.isArray(node.data.elementary.inflows)) &&
        (!node.data.elementary.outflows || Array.isArray(node.data.elementary.outflows))
      ))
    );
  } catch (error) {
    console.error('Node validation failed:', error, node);
    return false;
  }
}

// Validate edge data structure
function isValidEdge(edge: any): edge is Edge<FlowData> {
  try {
    const isValid = (
      typeof edge === 'object' &&
      edge !== null &&
      // Basic edge properties
      typeof edge.id === 'string' &&
      typeof edge.source === 'string' &&
      typeof edge.target === 'string' &&
      // Optional properties that should be of correct type if present
      (edge.sourceHandle === undefined || typeof edge.sourceHandle === 'string') &&
      (edge.targetHandle === undefined || typeof edge.targetHandle === 'string') &&
      // Flow data
      (!edge.data || (
        typeof edge.data === 'object' &&
        (edge.data.amount === undefined || typeof edge.data.amount === 'number') &&
        (edge.data.unit === undefined || typeof edge.data.unit === 'string')
      ))
    );

    if (!isValid) {
      console.warn('Edge validation failed:', edge);
    }
    return isValid;
  } catch (error) {
    console.error('Edge validation failed:', error, edge);
    return false;
  }
}

// Deep clone function to ensure we don't store references
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export const useGraph = create<GraphState>((set, get) => {
  // Initialize id counter
  let id = 1;

  // Create debounced save function
  const debouncedSave = debounce(() => {
    const state = get();
    try {
      const data = {
        version: STORAGE_VERSION,
        nodes: deepClone(state.nodes),
        edges: deepClone(state.edges),
        lastSaved: new Date().toISOString(),
      };
      const projectId = useProjectsStore.getState().selectedId;
      localStorage.setItem(getStorageKey(projectId), JSON.stringify(data));
      console.log('Graph saved:', {
        nodeCount: state.nodes.length,
        edgeCount: state.edges.length,
        timestamp: data.lastSaved
      });
    } catch (error) {
      console.error('Failed to save graph:', error);
    }
  }, 500);

  return {
    nodes: [],
    edges: [],
    addProcess: () => {
      const stage: ProcessData["stage"] = "production";
      const x = snapToStageX(stage);
      // Update id to be higher than any existing node id
      id = Math.max(id, getHighestNodeId(get().nodes) + 1);
      const newNode: Node<ProcessData> = {
        id: `p${id++}`,
        type: "process",
        position: { x, y: 120 + Math.random() * 120 },
        data: { title: "Prozess", stage },
      };
      set((s) => ({ nodes: [...s.nodes, deepClone(newNode)] }));
      debouncedSave();
      return newNode;
    },
    onNodesChange: (changes) => {
      set((state) => {
        const newState = {
          ...state,
          nodes: deepClone(state.nodes)
        };
        changes.forEach((change) => {
          if (change.type === 'position' && change.position) {
            const node = newState.nodes.find(n => n.id === change.id);
            if (node) {
              node.position = change.position;
            }
          }
        });
        console.log('Nodes changed:', changes);
        debouncedSave();
        return newState;
      });
    },
    onEdgesChange: (changes) => {
      set((state) => {
        const newState = {
          ...state,
          edges: deepClone(state.edges)
        };
        changes.forEach((change) => {
          if (change.type === 'remove') {
            newState.edges = newState.edges.filter(e => e.id !== change.id);
          }
        });
        console.log('Edges changed:', changes);
        debouncedSave();
        return newState;
      });
    },
    onConnect: (connection) => {
      const edge: Edge<FlowData> = {
        ...connection,
        id: generateEdgeId(
          connection.source,
          connection.sourceHandle,
          connection.target,
          connection.targetHandle
        ),
        data: { amount: 1, unit: "kg" }
      };
      set((state) => {
        const newEdges = [...state.edges, edge];
        console.log('Edge connected:', edge);
        debouncedSave();
        return { edges: newEdges };
      });
    },
    setNodes: (nodes) => {
      set({ nodes: deepClone(nodes) });
      debouncedSave();
    },
    setEdges: (edges) => {
      set({ edges: deepClone(edges) });
      debouncedSave();
    },
    save: () => {
      try {
        const { nodes, edges } = get();
        const projectId = useProjectsStore.getState().selectedId;
        const data = {
          version: STORAGE_VERSION,
          nodes: deepClone(nodes),
          edges: deepClone(edges),
          lastSaved: new Date().toISOString(),
        };
        localStorage.setItem(getStorageKey(projectId), JSON.stringify(data));
        console.log('Graph saved successfully:', {
          projectId,
          nodeCount: nodes.length,
          edgeCount: edges.length,
          timestamp: data.lastSaved
        });
      } catch (error) {
        console.error('Failed to save graph:', error);
      }
    },
    load: () => {
      try {
        const projectId = useProjectsStore.getState().selectedId;
        const raw = localStorage.getItem(getStorageKey(projectId));
        
        if (!raw) {
          set({ nodes: [], edges: [] });
          return;
        }

        const data = JSON.parse(raw);
        
        // Handle version migrations if needed
        if (!data.version || data.version < STORAGE_VERSION) {
          console.warn('Loading data from older version:', data.version);
          // Add migration logic here if needed in the future
        }

        // Validate and fix nodes
        const nodes = Array.isArray(data.nodes) ? data.nodes.map(node => {
          // Ensure all required properties are present
          const validNode = {
            ...node,
            type: node.type || "process",
            position: {
              x: typeof node.position?.x === 'number' ? node.position.x : 0,
              y: typeof node.position?.y === 'number' ? node.position.y : 0
            },
            data: {
              ...node.data,
              title: node.data?.title || "Prozess",
              stage: node.data?.stage || "production",
              elementary: node.data?.elementary || { inflows: [], outflows: [] }
            }
          };
          return isValidNode(validNode) ? validNode : null;
        }).filter(Boolean) : [];

        // Validate and fix edges
        const edges = Array.isArray(data.edges) ? data.edges.map(edge => {
          // Ensure all required properties are present
          const validEdge = {
            ...edge,
            data: edge.data || { amount: 1, unit: "kg" }
          };
          return isValidEdge(validEdge) ? validEdge : null;
        }).filter(Boolean) : [];

        // Update id counter to prevent conflicts
        id = getHighestNodeId(nodes) + 1;

        // Set state with validated data
        set({ nodes: deepClone(nodes), edges: deepClone(edges) });

        console.log('Graph loaded successfully:', {
          projectId,
          nodeCount: nodes.length,
          edgeCount: edges.length,
          nodes: nodes.map(n => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: { title: n.data.title, stage: n.data.stage }
          })),
          edges: edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            data: e.data
          })),
          loadedAt: new Date().toISOString(),
          savedAt: data.lastSaved
        });
      } catch (error) {
        console.error('Failed to load graph:', error);
        set({ nodes: [], edges: [] });
      }
    },
    clear: () => {
      set({ nodes: [], edges: [] });
      id = 1; // Reset id counter
    },
  };
});
