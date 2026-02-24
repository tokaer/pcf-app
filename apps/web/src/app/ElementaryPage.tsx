import { useMemo, useState, useEffect } from "react";
import { useGraph } from "@/state/graph";
import { useProjectsStore } from "@/state/projects";
import { useDatasets } from "./useDatasets";
import { fixDatasets } from "./fixDatasets";
import { useDatasetSelections } from "@/state/datasets";
import { ChevronDown, ChevronRight } from "lucide-react";
import { LIFECYCLE_PHASES, type LifecyclePhase } from "@/lib/lifecycle";

export function ElementaryPage() {
  const processes = useGraph((s) => s.nodes);
  const loadGraph = useGraph((s) => s.load);
  const selectedProjectId = useProjectsStore((s) => s.selectedId);
  const [version, setVersion] = useState(0);
  const { list: datasets, loading, error } = useDatasets();
  const datasetSelections = useDatasetSelections();
  
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<LifecyclePhase, boolean>>({
    material: false,
    production: false,
    distribution: false,
    use: false,
    eol: false
  });

  // Load dataset selections and fix dataset IDs when project changes
  useEffect(() => {
    datasetSelections.load();
    fixDatasets();
  }, [selectedProjectId]);

  // Debug logging
  useEffect(() => {
    console.log("ElementaryPage: datasets loaded:", datasets);
    console.log("ElementaryPage: loading:", loading);
    console.log("ElementaryPage: error:", error);
    
    // Trigger a re-render when datasets change
    if (datasets && Array.isArray(datasets) && datasets.length > 0) {
      setVersion(v => v + 1);
    }
  }, [datasets, loading, error]);

  // Reload Graph when project changes
  useEffect(() => {
    loadGraph();
    setVersion((v) => v + 1);
  }, [selectedProjectId, loadGraph]);

  // One-time fix for dataset ID
  useEffect(() => {
    const nodes = useGraph.getState().nodes;
    let updated = false;

    const updatedNodes = nodes.map((node: any) => {
      if (node.data?.elementary?.outflows) {
        const outflows = node.data.elementary.outflows.map((flow: any) => {
          if (flow.name === "Abfall" && flow.datasetId === 3) {
            updated = true;
            return { ...flow, datasetId: 4 };
          }
          return flow;
        });
        return {
          ...node,
          data: {
            ...node.data,
            elementary: {
              ...node.data.elementary,
              outflows
            }
          }
        };
      }
      return node;
    });

    if (updated) {
      useGraph.getState().setNodes(updatedNodes);
      useGraph.getState().save();
      console.log("Updated dataset ID for Abfall flow from 3 to 4");
    }
  }, []);

  const rows = useMemo(() => {
    const items: Array<{ 
      processId: string; 
      process: string; 
      kind: string; 
      name: string; 
      amount: number; 
      unit: string; 
      direction: "in" | "out"; 
      elemIndex: number; 
      dirKey: "inputs" | "outputs"; 
      datasetId?: number;
      phase: LifecyclePhase;
    }> = [];
    
    try {
      for (const p of processes) {
        const title = (p as any).data?.title ?? p.id;
        const el = (p as any).data?.elementary as any;
        const phase = (p as any).data?.stage as LifecyclePhase || "production";
        
        if (el?.inputs && Array.isArray(el.inputs)) {
          el.inputs.forEach((i: any, idx: number) => {
            // Get saved dataset selection
            const key = `${p.id}_inputs_${idx}`;
            const savedDatasetId = datasetSelections.selections[key];
            items.push({ 
              processId: p.id, 
              process: title, 
              kind: i.kind || "material", 
              name: i.name, 
              amount: i.amount, 
              unit: i.unit, 
              direction: "in", 
              elemIndex: idx, 
              dirKey: "inputs", 
              datasetId: savedDatasetId || i.datasetId,
              phase
            });
          });
        }
        
        if (el?.outputs && Array.isArray(el.outputs)) {
          el.outputs.forEach((o: any, idx: number) => {
            // Get saved dataset selection
            const key = `${p.id}_outputs_${idx}`;
            const savedDatasetId = datasetSelections.selections[key];
            items.push({ 
              processId: p.id, 
              process: title, 
              kind: o.kind || "waste", 
              name: o.name, 
              amount: o.amount, 
              unit: o.unit, 
              direction: "out", 
              elemIndex: idx, 
              dirKey: "outputs", 
              datasetId: savedDatasetId || o.datasetId,
              phase
            });
          });
        }
      }
    } catch (err) {
      console.error("Error generating rows:", err);
    }
    
    console.log('Generated rows with selections:', { items, selections: datasetSelections.selections });
    try { localStorage.setItem("pcf_elementary_snapshot", JSON.stringify(items)); } catch {}
    
    // Group items by lifecycle phase
    const groupedItems: Record<LifecyclePhase, typeof items> = {
      material: [],
      production: [],
      distribution: [],
      use: [],
      eol: []
    };
    
    // Safely assign items to their phases
    items.forEach(item => {
      if (item.phase && groupedItems[item.phase]) {
        groupedItems[item.phase].push(item);
      } else {
        // Default to production if phase is invalid
        groupedItems.production.push(item);
      }
    });

    // Update expanded sections based on content
    setExpandedSections(prev => {
      const next = { ...prev };
      Object.entries(groupedItems).forEach(([phase, items]) => {
        if (items.length > 0 && !prev[phase as LifecyclePhase]) {
          next[phase as LifecyclePhase] = true;
        }
      });
      return next;
    });

    return groupedItems;
  }, [processes, version]);

  const setDatasetForRow = (row: any, datasetId?: number) => {
    if (!row) {
      console.error("Cannot set dataset for undefined row");
      return;
    }
    
    console.log("Setting dataset for row:", { row, datasetId });
    
    // Save in dataset selections
    datasetSelections.setDatasetForElement(row.processId, row.elemIndex, row.dirKey, datasetId);
    
    // Update graph state
    const update = useGraph.getState().setNodes;
    const current = useGraph.getState().nodes as any[];
    const next = current.map((n) => {
      if (n.id !== row.processId) return n;
      const data = { ...(n.data || {}) };
      
      // Ensure elementary data has the right structure
      if (!data.elementary) {
        data.elementary = { inputs: [], outputs: [] };
      }
      
      // Create a safe reference to elementary data
      const elementary = {
        inputs: Array.isArray(data.elementary.inputs) ? [...data.elementary.inputs] : [],
        outputs: Array.isArray(data.elementary.outputs) ? [...data.elementary.outputs] : []
      };
      
      console.log(`Updating dataset for ${row.dirKey}[${row.elemIndex}] to ${datasetId}`);
      
      // Update the dataset ID
      if (elementary[row.dirKey] && elementary[row.dirKey][row.elemIndex]) {
        elementary[row.dirKey][row.elemIndex] = { 
          ...elementary[row.dirKey][row.elemIndex], 
          datasetId 
        };
        console.log("Updated element:", elementary[row.dirKey][row.elemIndex]);
      } else {
        console.warn(`Element at ${row.dirKey}[${row.elemIndex}] not found`);
      }
      
      // Update the data
      data.elementary = elementary;
      return { ...n, data };
    });
    
    // Update the store
    update(next as any);
    
    // Save to localStorage
    try { 
      localStorage.setItem("pcf_graph_v1", JSON.stringify({ 
        nodes: next, 
        edges: useGraph.getState().edges 
      })); 
    } catch (err) {
      console.error("Error saving to localStorage:", err);
    }
    
    // Force a re-render by updating the version
    setVersion(v => v + 1);
  };

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900 text-white">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-medium">Elementarflüsse aller Prozesse</div>
        </div>
        

        <div className="space-y-4">
          {(Object.entries(LIFECYCLE_PHASES) as [LifecyclePhase, string][]).map(([phase, title]) => {
            const phaseRows = rows[phase] || [];
            const hasContent = phaseRows.length > 0;
            const isExpanded = expandedSections[phase];

            return (
              <div key={phase} className="border border-neutral-800 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-3 bg-neutral-800 text-left hover:bg-neutral-700"
                  onClick={() => setExpandedSections(prev => ({ ...prev, [phase]: !prev[phase] }))}
                >
                  <span className="font-medium">{title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-400">
                      {phaseRows.length} Elementarflüsse
                    </span>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-800/50 text-neutral-200">
                        <tr>
                          <th className="text-left p-2">Prozess</th>
                          <th className="text-left p-2">Richtung</th>
                          <th className="text-left p-2">Art</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Menge</th>
                          <th className="text-left p-2">Einheit</th>
                          <th className="text-left p-2">Dataset</th>
                          <th className="text-left p-2">THG Emissionen [kgCO₂e]</th>
                        </tr>
                      </thead>
                      <tbody>
                        {phaseRows.map((r, idx) => {
                          // Find the selected dataset if any
                          const selectedDataset = r.datasetId && datasets && Array.isArray(datasets) 
                            ? datasets.find((d: any) => d && d.id === r.datasetId) 
                            : null;
                          // Calculate emissions if we have both amount and dataset
                          const emissions = selectedDataset && r.amount ? (r.amount * selectedDataset.valueCO2e).toFixed(2) : null;
                          
                          return (
                            <tr key={`${phase}-${idx}`} className="border-t border-neutral-800">
                              <td className="p-2">{r.process}</td>
                              <td className="p-2">{r.direction === "in" ? "Input" : "Output"}</td>
                              <td className="p-2">
                                {r.kind === "material" ? "Material" : 
                                 r.kind === "energy" ? "Energie" : 
                                 r.kind === "waste" ? "Abfall" : 
                                 r.kind === "emissions" ? "Emissionen" : r.kind}
                              </td>
                              <td className="p-2">{r.name}</td>
                              <td className="p-2">{r.amount}</td>
                              <td className="p-2">{r.unit}</td>
                              <td className="p-2">
                                <select
                                  value={r.datasetId ?? ""}
                                  onChange={(e)=>setDatasetForRow(r, e.target.value ? Number(e.target.value) : undefined)}
                                  className="bg-neutral-800 rounded px-2 py-1 text-sm border border-neutral-700"
                                >
                                  <option value="">—</option>
                                  {datasets && Array.isArray(datasets) ? datasets.map((d:any)=>(
                                    d && <option key={d.id} value={d.id}>{`${d.name} (${d.unit})`}</option>
                                  )) : null}
                                </select>
                              </td>
                              <td className="p-2">{emissions ?? "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}