import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Background, Controls, MiniMap, ReactFlow, addEdge,
  useEdgesState, useNodesState, Panel, NodeChange
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ProcessNode from "@/canvas/ProcessNode";
import FlowEdge from "@/canvas/FlowEdge";
import { useGraph } from "@/state/graph";
import { useProjectsStore } from "@/state/projects";
import { useDatasets } from "./useDatasets";
import type { ProcessData, ElementaryItem } from "@/types/flows";
import { LifecycleStage, LIFECYCLE_STAGES } from "@/types/lifecycle";
import { Trash2 } from "lucide-react";
import { migrateElementaryFlows } from "./migrateElementaryFlows";
import { CanvasToolbar } from "@/components/CanvasToolbar";

const nodeTypes = { process: ProcessNode };
const edgeTypes = { flow: FlowEdge };

const FIT_VIEW_OPTIONS = {
  padding: 0.2,  // Etwas mehr Padding für besseren Überblick
  minZoom: 0.1,  // Nicht zu weit rauszoomen
  maxZoom: 2     // Erlaubt mehr Zoom für Details
} as const;

export function CanvasPage() {
  const {
    nodes: nodesFromStore,
    edges: edgesFromStore,
    addProcess,
    save: saveStore,
    load: loadStore,
    clear: clearStore,
    setNodes: setNodesInStore,
    setEdges: setEdgesInStore,
    onNodesChange: onNodesChangeStore,
    onEdgesChange: onEdgesChangeStore,
    onConnect: onConnectStore
  } = useGraph();
  const selectedProjectId = useProjectsStore((s) => s.selectedId);

  const [nodes, setNodes, _onNodesChange] = useNodesState(nodesFromStore);
  const [edges, setEdges, onEdgesChange] = useEdgesState(edgesFromStore);
  const { list: datasets } = useDatasets();
  const reactFlowInstance = useRef<any>(null);
  const [editElementaryFor, setEditElementaryFor] = useState<string | null>(null);

  // Nur manuelles Fitting über React Flow Button
  const fitView = useCallback(() => {
    if (!reactFlowInstance.current) return;

    try {
      // Sidebar-Breite messen
      const sidebarWidth = document.querySelector('.sidebar')?.getBoundingClientRect().width || 0;
      
      // Flow-Container Dimensionen
      const flowContainer = document.querySelector('.react-flow')?.getBoundingClientRect();
      if (!flowContainer) return;

      // Verfügbarer Platz
      const availableWidth = flowContainer.width - sidebarWidth;
      const availableHeight = flowContainer.height;

      // Nodes Bounds berechnen
      const nodes = reactFlowInstance.current.getNodes();
      if (nodes.length === 0) return;

      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;

      nodes.forEach(node => {
        if (!node.width || !node.height) return;
        minX = Math.min(minX, node.position.x);
        maxX = Math.max(maxX, node.position.x + node.width);
        minY = Math.min(minY, node.position.y);
        maxY = Math.max(maxY, node.position.y + node.height);
      });

      // Content Dimensionen
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;

      // Zoom berechnen
      const xZoom = (availableWidth * 0.9) / contentWidth;   // 90% der verfügbaren Breite
      const yZoom = (availableHeight * 0.9) / contentHeight; // 90% der verfügbaren Höhe
      const zoom = Math.min(Math.min(xZoom, yZoom), 1.5);    // Maximal 1.5x Zoom

      // Center Position
      const centerX = minX + contentWidth / 2;
      const centerY = minY + contentHeight / 2;

      // Viewport setzen
      reactFlowInstance.current.setViewport({
        x: (availableWidth / 2 + sidebarWidth) - (centerX * zoom),
        y: (availableHeight / 2) - (centerY * zoom),
        zoom: zoom
      }, { duration: 800 });

    } catch (error) {
      console.warn('Fit view error:', error);
    }
  }, []);

  // Event Handlers
  useEffect(() => {
    const onUpdateTitle = (e: any) => {
      const { id, title } = e.detail || {};
      setNodes((ns) => {
        const updated = ns.map((n) => (n.id === id ? { ...n, data: { ...(n.data as ProcessData), title } } : n));
        setNodesInStore(updated as any);
        saveStore();
        return updated;
      });
    };

    const onUpdateStage = (e: any) => {
      const { id, stage } = e.detail || {};
      setNodes((ns) => {
        const updated = ns.map((n) => (n.id === id ? { ...n, data: { ...(n.data as ProcessData), stage } } : n));
        setNodesInStore(updated as any);
        saveStore();
        return updated;
      });
    };

    const onEditElementary = (e: any) => {
      setEditElementaryFor(e.detail?.id ?? null);
    };

    const onDeleteNode = (e: any) => {
      const { id } = e.detail || {};
      setNodes((ns) => {
        const updated = ns.filter(n => n.id !== id);
        setNodesInStore(updated as any);
        setEdges((es) => {
          const updatedEdges = es.filter(e => e.source !== id && e.target !== id);
          setEdgesInStore(updatedEdges as any);
          return updatedEdges;
        });
        saveStore();
        return updated;
      });
    };

    window.addEventListener("pcf:updateNodeTitle", onUpdateTitle as any);
    window.addEventListener("pcf:updateNodeStage", onUpdateStage as any);
    window.addEventListener("pcf:editElementary", onEditElementary as any);
    window.addEventListener("pcf:deleteNode", onDeleteNode as any);

    return () => {
      window.removeEventListener("pcf:updateNodeTitle", onUpdateTitle as any);
      window.removeEventListener("pcf:updateNodeStage", onUpdateStage as any);
      window.removeEventListener("pcf:editElementary", onEditElementary as any);
      window.removeEventListener("pcf:deleteNode", onDeleteNode as any);
    };
  }, [setNodes, setNodesInStore, saveStore, setEdges, setEdgesInStore]);

  // Load data when project changes
  useEffect(() => {
    try {
      // First load the data
      loadStore();
      
      // Then migrate the elementary flows
      migrateElementaryFlows();
      
      // Finally reload to get the migrated data
      setTimeout(() => {
        loadStore();
        console.log("Reloaded data after migration");
      }, 100);
    } catch (error) {
      console.error("Error in load/migrate sequence:", error);
    }
  }, [selectedProjectId, loadStore]);

  // Sync with store and preserve positions
  useEffect(() => {
    setNodes((prev) => {
      const prevIds = prev.map((n) => n.id).join("|");
      const storeIds = nodesFromStore.map((n) => n.id).join("|");
      if (prevIds === storeIds) return prev;

      const byId = new Map(prev.map((n) => [n.id, n] as const));
      return nodesFromStore.map((sn) => (byId.has(sn.id) ? { ...sn, position: byId.get(sn.id)!.position } : sn));
    });
  }, [nodesFromStore, setNodes]);

  // Update edges when store changes
  useEffect(() => {
    const localIds = edges.map((e) => e.id).join("|");
    const storeIds = edgesFromStore.map((e) => e.id).join("|");
    if (localIds !== storeIds) {
      setEdges(edgesFromStore);
    }
  }, [edgesFromStore, setEdges]);

  const onNodesChange = (changes: NodeChange[]) => {
    _onNodesChange(changes);
    onNodesChangeStore(changes);
  };

  const onConnect = useCallback((params: any) => {
    if (!params?.source || !params?.target) return;

    const connectionExists = edges.some(edge =>
      edge.source === params.source &&
      edge.target === params.target &&
      edge.sourceHandle === params.sourceHandle &&
      edge.targetHandle === params.targetHandle
    );

    if (connectionExists) return;

    const newEdge = {
      ...params,
      id: `e_${params.source}${params.sourceHandle || ''}_${params.target}${params.targetHandle || ''}_${Date.now()}`,
      type: 'flow',
      data: { name: '', amount: 1, unit: 'kg' }
    };

    const updatedEdges = [...edges, newEdge];
    setEdges(updatedEdges);
    setEdgesInStore(updatedEdges);
    saveStore();
  }, [edges, setEdgesInStore, saveStore]);

  // Get viewport center or mouse position
  const getViewportCenter = useCallback((): { x: number; y: number } => {
    // Default safe position
    const defaultPosition = { x: 150, y: 150 };
    
    if (!reactFlowInstance.current) {
      console.log("No ReactFlow instance available, using default position");
      return defaultPosition;
    }

    try {
      const viewport = reactFlowInstance.current.getViewport();
      
      // Check if we have valid viewport data
      if (!viewport || typeof viewport !== 'object') {
        console.log("Invalid viewport, using default position");
        return defaultPosition;
      }
      
      const { width, height, x, y, zoom } = viewport;
      
      // Validate all viewport values
      if (typeof width !== 'number' || 
          typeof height !== 'number' || 
          typeof x !== 'number' || 
          typeof y !== 'number' ||
          typeof zoom !== 'number' ||
          isNaN(width) || isNaN(height) || isNaN(x) || isNaN(y) || isNaN(zoom) ||
          zoom <= 0) {
        console.log("Invalid viewport values:", viewport);
        return defaultPosition;
      }
      
      // Calculate the center with safer math
      const centerX = -(x / zoom) + (width / (2 * zoom));
      const centerY = -(y / zoom) + (height / (2 * zoom));
      
      // Final validation to ensure we don't return NaN
      if (isNaN(centerX) || isNaN(centerY)) {
        console.log("Calculated NaN position, using default");
        return defaultPosition;
      }
      
      console.log("Calculated viewport center:", { x: centerX, y: centerY });
      return { x: centerX, y: centerY };
    } catch (error) {
      console.error('Error getting viewport center:', error);
      return defaultPosition;
    }
  }, []);

  // Mapping of lifecycle stages to labels and process stages
  const LIFECYCLE_STAGE_MAP = {
    'raw_material_acquisition': { label: 'Rohstofferwerb', processStage: 'material' as const },
    'production': { label: 'Produktion', processStage: 'production' as const },
    'distribution': { label: 'Verteilung', processStage: 'distribution' as const },
    'use': { label: 'Nutzung', processStage: 'use' as const },
    'end_of_life': { label: 'Behandlung am Ende des Lebenswegs', processStage: 'eol' as const },
  };

  // Create a properly structured process node
  const createProcessNode = (id: string, position: { x: number; y: number }, title: string, stage: ProcessData["stage"]) => {
    return {
      id,
      type: "process",
      position,
      data: {
        title,
        stage,
        elementary: {
          inputs: [],
          outputs: []
        }
      }
    };
  };

  // Handle adding a process with a specific lifecycle stage
  // Keep track of offset for new nodes
  const [nodeOffset, setNodeOffset] = useState({ x: 0, y: 0 });

  // Function to add a process node with the specified lifecycle stage
  const handleAddProcess = useCallback((stage: LifecycleStage) => {
    try {
      // Generate a unique ID
      const newId = `proc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      
      // Get center position with fallback
      const pos = getViewportCenter();
      const baseX = typeof pos.x === 'number' && !isNaN(pos.x) ? pos.x : 100;
      const baseY = typeof pos.y === 'number' && !isNaN(pos.y) ? pos.y : 100;
      
      // Get stage info with fallbacks
      const stageInfo = LIFECYCLE_STAGE_MAP[stage] || { 
        label: 'Prozess', 
        processStage: 'production' as const
      };
      
      // Apply the current offset to the position
      const safePosition = {
        x: baseX + nodeOffset.x,
        y: baseY + nodeOffset.y
      };
      
      console.log("Creating node with stage:", stage);
      console.log("Position with offset:", safePosition);
      
      // Create the new node with our helper function
      const newNode = createProcessNode(
        newId, 
        safePosition, 
        "Prozess", // Fixed title
        stageInfo.processStage
      );
      
      // Update the offset for the next node (create a cascading effect)
      setNodeOffset(prev => ({
        x: prev.x + 25,
        y: prev.y + 25
      }));
      
      // Update nodes and store
      setNodes(currentNodes => {
        const updatedNodes = [...currentNodes, newNode];
        
        // Defer store update to avoid React warning about state updates
        setTimeout(() => {
          setNodesInStore(updatedNodes);
          saveStore();
        }, 0);
        
        return updatedNodes;
      });
      
    } catch (error) {
      console.error("Error creating new process:", error);
    }
  }, [getViewportCenter, nodeOffset, setNodesInStore, saveStore]);

  // Clear the canvas with confirmation
  const clearCanvas = useCallback(async () => {
    const ok = window.confirm('Canvas wirklich leeren?');
    if (!ok) return;
    
    setNodes([]);
    setEdges([]);
    setNodesInStore([]);
    setEdgesInStore([]);
    
    // Reset the node offset when clearing the canvas
    setNodeOffset({ x: 0, y: 0 });
    
    // Also clear storage
    try {
      const projectId = useProjectsStore.getState().selectedId;
      localStorage.removeItem(`flowState_${projectId || 'default'}`);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
    
  }, [setNodes, setEdges, setNodesInStore, setEdgesInStore]);

  const selected = useMemo(() => edges.find((e: any) => e.selected), [edges]);
  const nodeToEdit = useMemo(() => nodes.find((n) => n.id === editElementaryFor), [nodes, editElementaryFor]);
  // Ensure elementary data is properly structured
  const elementary = useMemo(() => {
    const elemData = (nodeToEdit?.data as ProcessData | undefined)?.elementary;
    return {
      inputs: Array.isArray(elemData?.inputs) ? elemData.inputs : [],
      outputs: Array.isArray(elemData?.outputs) ? elemData.outputs : []
    };
  }, [nodeToEdit]);

  const updateElementary = (dir: "inputs" | "outputs", idx: number, patch: Partial<ElementaryItem>) => {
    if (!nodeToEdit) return;
    
    setNodes((ns) => {
      const next = ns.map((n) => {
        if (n.id !== nodeToEdit.id) return n;
        
        // Create a safe copy of the node data
        const data = { ...(n.data as ProcessData) };
        
        // Ensure elementary exists with proper structure
        if (!data.elementary) {
          data.elementary = { inputs: [], outputs: [] };
          return { ...n, data }; // Can't update if there's no array yet
        }
        
        // Get the current array safely
        const currentArray = Array.isArray(data.elementary[dir]) ? [...data.elementary[dir]] : [];
        
        // Only update if index is valid
        if (idx >= 0 && idx < currentArray.length) {
          // Create a safe updated item
          const updatedItem = { 
            ...currentArray[idx],
            ...patch,
            // Ensure kind is valid
            kind: dir === "inputs" 
              ? (patch.kind === "material" || patch.kind === "energy" ? patch.kind : currentArray[idx].kind) 
              : (patch.kind === "waste" || patch.kind === "emissions" ? patch.kind : currentArray[idx].kind)
          };
          
          // Update the item
          currentArray[idx] = updatedItem;
        }
        
        // Update the elementary data
        data.elementary = {
          inputs: dir === "inputs" ? currentArray : (data.elementary.inputs || []),
          outputs: dir === "outputs" ? currentArray : (data.elementary.outputs || [])
        };
        
        return { ...n, data };
      });
      
      setNodesInStore(next as any);
      saveStore();
      return next;
    });
  };

  const addElementary = (dir: "inputs" | "outputs") => {
    if (!nodeToEdit) return;
    setNodes((ns) => {
      const next = ns.map((n) => {
        if (n.id !== nodeToEdit.id) return n;
        
        // Create a safe copy of the node data
        const data = { ...(n.data as ProcessData) };
        
        // Ensure elementary exists with proper structure
        if (!data.elementary) {
          data.elementary = { inputs: [], outputs: [] };
        }
        
        // Get the current array or create a new one
        const currentArray = Array.isArray(data.elementary[dir]) ? data.elementary[dir] : [];
        
        // Create a new item with the appropriate kind
        const newItem = { 
          kind: dir === "inputs" ? "material" : "waste", 
          name: dir === "inputs" ? "neuer Input" : "neuer Output", 
          amount: 1, 
          unit: "kg" 
        };
        
        // Update the elementary data
        data.elementary = {
          inputs: dir === "inputs" ? [...currentArray, newItem] : (data.elementary.inputs || []),
          outputs: dir === "outputs" ? [...currentArray, newItem] : (data.elementary.outputs || [])
        };
        
        return { ...n, data };
      });
      
      setNodesInStore(next as any);
      saveStore();
      return next;
    });
  };

  const removeElementary = (dir: "inputs" | "outputs", idx: number) => {
    if (!nodeToEdit) return;
    
    setNodes((ns) => {
      const next = ns.map((n) => {
        if (n.id !== nodeToEdit.id) return n;
        
        // Create a safe copy of the node data
        const data = { ...(n.data as ProcessData) };
        
        // Ensure elementary exists with proper structure
        if (!data.elementary) {
          data.elementary = { inputs: [], outputs: [] };
          return { ...n, data }; // Nothing to remove
        }
        
        // Get the current array safely
        const currentArray = Array.isArray(data.elementary[dir]) ? [...data.elementary[dir]] : [];
        
        // Only remove if index is valid
        if (idx >= 0 && idx < currentArray.length) {
          currentArray.splice(idx, 1);
        }
        
        // Update the elementary data
        data.elementary = {
          inputs: dir === "inputs" ? currentArray : (data.elementary.inputs || []),
          outputs: dir === "outputs" ? currentArray : (data.elementary.outputs || [])
        };
        
        return { ...n, data };
      });
      
      setNodesInStore(next as any);
      saveStore();
      return next;
    });
  };

  return (
    <div style={{ height: "calc(100vh - 80px)" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
      >
        <MiniMap
          pannable
          zoomable
          nodeColor={() => "#9CA3AF"}
          maskColor="rgba(17,24,39,0.85)"
          style={{ background: "#0b0b0b", border: "1px solid #1f2937" }}
        />
        <Controls
          style={{ background: "#111827", border: "1px solid #1f2937", color: "#E5E7EB" }}
          fitViewOptions={FIT_VIEW_OPTIONS}
          onFitView={fitView}
        />
        <Background color="#374151" gap={18} size={1} />

        <Panel position="top-right">
          <CanvasToolbar 
            onAddProcess={handleAddProcess} 
            onClear={clearCanvas}
          />
        </Panel>

        {selected && (
          <Panel position="bottom-right" className="rounded bg-neutral-900/90 text-white p-3 space-y-2 w-64">
            <div className="text-sm font-medium">Kante bearbeiten</div>
            <div className="space-y-1">
              <label className="text-xs opacity-80">Name</label>
              <input
                type="text"
                value={(selected as any).data?.name ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  const updatedEdges = edges.map((edge) =>
                    edge.id === selected.id ? { ...edge, data: { ...(edge as any).data, name: v } } as any : edge
                  );
                  setEdges(updatedEdges);
                  setEdgesInStore(updatedEdges);
                  saveStore();
                }}
                className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm"
                placeholder="Name des Flusses"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs opacity-80">Menge</label>
              <input
                type="number" min={0} step={0.01}
                value={(selected as any).data?.amount ?? 1}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  const updatedEdges = edges.map((edge) =>
                    edge.id === selected.id ? { ...edge, data: { ...(edge as any).data, amount: v } } as any : edge
                  );
                  setEdges(updatedEdges);
                  setEdgesInStore(updatedEdges);
                  saveStore();
                }}
                className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs opacity-80">Einheit</label>
              <select
                value={(selected as any).data?.unit ?? "kg"}
                onChange={(e) => {
                  const v = e.target.value;
                  const updatedEdges = edges.map((edge) =>
                    edge.id === selected.id ? { ...edge, data: { ...(edge as any).data, unit: v } } as any : edge
                  );
                  setEdges(updatedEdges);
                  setEdgesInStore(updatedEdges);
                  saveStore();
                }}
                className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm"
              >
                {(["kg","t","kWh","MJ","l","tkm"] as const).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </Panel>
        )}

        {nodeToEdit && (
          <Panel position="bottom-left" className="rounded bg-neutral-900/90 text-white p-3 space-y-2 w-[420px]">
            <div className="text-sm font-medium mb-1">Elementarflüsse: {(nodeToEdit.data as ProcessData).title}</div>
            <div className="text-xs opacity-80">Inputs</div>
            {elementary.inputs.length === 0 && (
              <div className="text-xs opacity-60">Keine Einträge</div>
            )}
            {elementary.inputs.map((it, idx) => (
              <div key={`in-${idx}`} className="flex items-center gap-2 text-xs mb-1">
                <select value={it.kind} onChange={(e)=>updateElementary("inputs", idx, { kind: e.target.value as any })} className="bg-neutral-800 rounded px-1 py-0.5">
                  <option value="material">Material</option>
                  <option value="energy">Energie</option>
                </select>
                <input value={it.name} onChange={(e)=>updateElementary("inputs", idx, { name: e.target.value })} className="bg-neutral-800 rounded px-1 py-0.5 flex-1" />
                <input type="number" step="0.01" min="0" value={it.amount} onChange={(e)=>updateElementary("inputs", idx, { amount: Number(e.target.value) })} className="bg-neutral-800 rounded px-1 py-0.5 w-20" />
                <select value={it.unit} onChange={(e)=>updateElementary("inputs", idx, { unit: e.target.value as any })} className="bg-neutral-800 rounded px-1 py-0.5 w-20">
                  {(["kg","t","kWh","MJ","l","m3","tkm"] as const).map(u=> <option key={u} value={u}>{u}</option>)}
                </select>
                <button className="p-1.5 rounded border border-red-700 text-red-400 hover:bg-red-900/20" title="Entfernen" onClick={()=>removeElementary("inputs", idx)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button className="text-[10px] px-2 py-1 rounded border border-neutral-700 bg-neutral-800" onClick={()=>addElementary("inputs")}>+ Input</button>

            <div className="text-xs opacity-80 mt-3">Outputs</div>
            {elementary.outputs.length === 0 && (
              <div className="text-xs opacity-60">Keine Einträge</div>
            )}
            {elementary.outputs.map((it, idx) => (
              <div key={`out-${idx}`} className="flex items-center gap-2 text-xs mb-1">
                <select value={it.kind} onChange={(e)=>updateElementary("outputs", idx, { kind: e.target.value as any })} className="bg-neutral-800 rounded px-1 py-0.5">
                  <option value="waste">Abfall</option>
                  <option value="emissions">Emissionen</option>
                </select>
                <input value={it.name} onChange={(e)=>updateElementary("outputs", idx, { name: e.target.value })} className="bg-neutral-800 rounded px-1 py-0.5 flex-1" />
                <input type="number" step="0.01" min="0" value={it.amount} onChange={(e)=>updateElementary("outputs", idx, { amount: Number(e.target.value) })} className="bg-neutral-800 rounded px-1 py-0.5 w-20" />
                <select value={it.unit} onChange={(e)=>updateElementary("outputs", idx, { unit: e.target.value as any })} className="bg-neutral-800 rounded px-1 py-0.5 w-20">
                  {(["kg","t","kWh","MJ","l","m3","tkm"] as const).map(u=> <option key={u} value={u}>{u}</option>)}
                </select>
                <button className="p-1.5 rounded border border-red-700 text-red-400 hover:bg-red-900/20" title="Entfernen" onClick={()=>removeElementary("outputs", idx)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button className="text-[10px] px-2 py-1 rounded border border-neutral-700 bg-neutral-800" onClick={()=>addElementary("outputs")}>+ Output</button>

            <div className="mt-2 text-right">
              <button className="text-[10px] px-2 py-1 rounded border border-neutral-700 bg-neutral-800" onClick={()=>setEditElementaryFor(null)}>Schließen</button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}