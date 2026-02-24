import { useEffect, useState, useMemo } from "react";
import { useGraph } from "@/state/graph";
import { useProjectsStore } from "@/state/projects";
import { computePCF } from "@/db/api";
import { HotspotChart } from "@/components/HotspotChart";
import { LIFECYCLE_PHASES, type LifecyclePhase } from "@/lib/lifecycle";
import { useDatasets } from "./useDatasets";
import { convertAmount } from "@/lib/units";

type ProcessEmissions = {
  processId: string;
  processName: string;
  totalEmissions: number;
};

export function ResultsPage() {
  const { nodes, edges, load, setNodes, save } = useGraph();
  const selectedProjectId = useProjectsStore((s) => s.selectedId);
  const { list: datasets, loading: datasetsLoading } = useDatasets();
  const [total, setTotal] = useState<number | null>(null);
  const [hotspots, setHotspots] = useState<{ label: string; value: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fix dataset IDs when datasets are loaded
  useEffect(() => {
    if (!datasetsLoading && datasets.length > 0) {
      let updated = false;
      const updatedNodes = nodes.map(node => {
        if (!node.data?.elementary?.outputs) return node;

        const outputs = node.data.elementary.outputs.map(flow => {
          if (flow.name === "Abfall" && flow.datasetId === 3) {
            updated = true;
            return { ...flow, datasetId: 4 };
          }
          return flow;
        });

        if (updated) {
          return {
            ...node,
            data: {
              ...node.data,
              elementary: {
                ...node.data.elementary,
                outputs
              }
            }
          };
        }
        return node;
      });

      if (updated) {
        console.log("Updating dataset IDs in graph");
        setNodes(updatedNodes);
        save();
      }
    }
  }, [datasets, datasetsLoading, nodes, setNodes, save]);

  // Calculate emissions by lifecycle phase and process
  const { phaseEmissions, processEmissions, totalEmissions } = useMemo(() => {
    // Don't calculate until datasets are loaded
    if (datasetsLoading || datasets.length === 0) {
      return {
        phaseEmissions: { material: 0, production: 0, distribution: 0, use: 0, eol: 0 },
        processEmissions: [],
        totalEmissions: 0
      };
    }

    const phaseEmissions: Record<LifecyclePhase, number> = {
      material: 0,
      production: 0,
      distribution: 0,
      use: 0,
      eol: 0,
    };
    
    const processEmissions: ProcessEmissions[] = [];
    let totalEmissions = 0;

          console.log('Starting calculation with nodes:', nodes.map(n => ({
      id: n.id,
      title: n.data?.title,
      stage: n.data?.stage,
      inputs: n.data?.elementary?.inputs?.length || 0,
      outputs: n.data?.elementary?.outputs?.length || 0
    })));

    console.log('Available datasets:', datasets.map(d => ({
      id: d.id,
      name: d.name,
      unit: d.unit,
      valueCO2e: d.valueCO2e
    })));

    for (const node of nodes) {
      const data = node.data as any;
      const stage = data?.stage as LifecyclePhase || "production";
      let processTotal = 0;

      console.log('Processing node:', {
        id: node.id,
        title: data?.title,
        stage,
        inputs: data?.elementary?.inputs,
        outputs: data?.elementary?.outputs
      });

      // Calculate inputs
      if (data?.elementary?.inputs) {
        for (const flow of data.elementary.inputs) {
          if (!flow?.datasetId) continue;
          const dataset = datasets.find(d => d.id === flow.datasetId);
          if (!dataset?.valueCO2e) continue;

          // Calculate emissions (no unit conversion)
          const emission = flow.amount * dataset.valueCO2e;
          console.log('Emission calculation (input):', {
            flow: flow.name,
            process: data.title,
            amount: flow.amount,
            unit: flow.unit,
            dataset: dataset.name,
            valueCO2e: dataset.valueCO2e,
            emission
          });
          processTotal += emission;
          phaseEmissions[stage] += emission;
          totalEmissions += emission;
        }
      }

      // Calculate outputs
      if (data?.elementary?.outputs) {
        for (const flow of data.elementary.outputs) {
          if (!flow?.datasetId) continue;
          const dataset = datasets.find(d => d.id === flow.datasetId);
          if (!dataset?.valueCO2e) continue;

          // Calculate emissions (no unit conversion)
          const emission = flow.amount * dataset.valueCO2e;
          console.log('Emission calculation (output):', {
            flow: flow.name,
            process: data.title,
            amount: flow.amount,
            unit: flow.unit,
            dataset: dataset.name,
            valueCO2e: dataset.valueCO2e,
            emission
          });
          processTotal += emission;
          phaseEmissions[stage] += emission;
          totalEmissions += emission;
        }
      }

      if (processTotal > 0) {
        processEmissions.push({
          processId: node.id,
          processName: data?.title || node.id,
          totalEmissions: processTotal
        });
      }
    }

    // Sort process emissions descending
    processEmissions.sort((a, b) => b.totalEmissions - a.totalEmissions);
    
    console.log('Final calculations:', {
      totalEmissions,
      phaseEmissions,
      processEmissions: processEmissions.map(p => ({
        name: p.processName,
        emissions: p.totalEmissions
      }))
    });
    
    return { phaseEmissions, processEmissions, totalEmissions };
  }, [nodes, datasets, datasetsLoading]);

  // Load graph when project changes
  useEffect(() => {
    load();
  }, [selectedProjectId, load]);

  // Set total PCF from calculated emissions
  useEffect(() => {
    setTotal(totalEmissions);
  }, [totalEmissions]);

  // Convert phase emissions to chart format
  const phaseEmissionsChart = {
    labels: Object.entries(LIFECYCLE_PHASES).map(([_, label]) => label),
    datasets: [{
      label: "kg CO₂e",
      data: Object.keys(phaseEmissions).map(phase => phaseEmissions[phase as LifecyclePhase]),
      backgroundColor: "#10b981",
    }]
  };

  return (
    <div className="space-y-4">
      <div className="rounded border p-4">
        <div className="text-sm opacity-70">Gesamt-PCF</div>
        <div className="text-3xl font-semibold">
          {total == null ? "—" : `${total.toLocaleString()} kg CO₂e`}
        </div>
      </div>

      <div className="rounded border p-4">
        <div className="text-sm opacity-70 mb-2">THG Emissionen nach Lebenszyklusphasen</div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <HotspotChart items={Object.entries(LIFECYCLE_PHASES).map(([phase, label]) => ({
          label,
          value: phaseEmissions[phase as LifecyclePhase]
        }))} />
      </div>

      <div className="rounded border p-4">
        <div className="text-sm opacity-70 mb-2">Top 5 Prozessmodule nach THG Emissionen</div>
        <div className="space-y-2">
          {processEmissions.slice(0, 5).map((process, idx) => (
            <div key={process.processId} className="flex items-center gap-4">
              <div className="text-sm font-medium w-8">{idx + 1}.</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{process.processName}</div>
                <div className="text-sm opacity-70">{process.totalEmissions.toLocaleString()} kg CO₂e</div>
              </div>
              <div className="w-32 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full" 
                  style={{ 
                    width: `${(process.totalEmissions / processEmissions[0].totalEmissions) * 100}%` 
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}