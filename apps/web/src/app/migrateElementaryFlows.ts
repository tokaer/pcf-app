import type { ProcessData, ElementaryItem } from "@/types/flows";
import type { Node } from "@xyflow/react";

export function migrateElementaryFlows() {
  console.log("Starting elementary flows migration");
  try {
    // Load graph data
    const graphData = localStorage.getItem("pcf_graph_v1");
    if (!graphData) {
      console.log("No graph data found in localStorage");
      return;
    }

    const data = JSON.parse(graphData);
    if (!data.nodes || !Array.isArray(data.nodes)) {
      console.log("Invalid graph data format", data);
      return;
    }

    let hasChanges = false;

    // Migrate nodes
    const nodes = data.nodes.map((node: Node<ProcessData>) => {
      if (!node?.data?.elementary) {
        return node;
      }

      console.log("Processing node:", node.id, "elementary:", node.data.elementary);
      
      // Create a safe elementary object with default values
      const safeElementary = {
        inputs: [],
        outputs: []
      };

      // Check if we have old format data to migrate
      if (Array.isArray(node.data.elementary.inflows) || Array.isArray(node.data.elementary.outflows)) {
        console.log("Migrating old format data for node:", node.id);
        
        // Migrate inflows to inputs
        if (Array.isArray(node.data.elementary.inflows)) {
          safeElementary.inputs = node.data.elementary.inflows.map((item: any) => ({
            kind: item.kind === "material" ? "material" : "energy",
            name: item.name || "migrierter Input",
            amount: Number(item.amount) || 1,
            unit: item.unit || "kg",
            datasetId: item.datasetId
          }));
        }
        
        // Migrate outflows to outputs
        if (Array.isArray(node.data.elementary.outflows)) {
          safeElementary.outputs = node.data.elementary.outflows.map((item: any) => ({
            kind: item.kind === "material" ? "waste" : "emissions",
            name: item.name || "migrierter Output",
            amount: Number(item.amount) || 1,
            unit: item.unit || "kg",
            datasetId: item.datasetId
          }));
        }
        
        hasChanges = true;
      } 
      // If we already have the new format, ensure it's valid
      else if (node.data.elementary.inputs || node.data.elementary.outputs) {
        console.log("Node already has new format, validating:", node.id);
        
        if (Array.isArray(node.data.elementary.inputs)) {
          safeElementary.inputs = node.data.elementary.inputs.map((item: any) => ({
            kind: item.kind === "material" || item.kind === "energy" ? item.kind : "material",
            name: item.name || "migrierter Input",
            amount: Number(item.amount) || 1,
            unit: item.unit || "kg",
            datasetId: item.datasetId
          }));
        }
        
        if (Array.isArray(node.data.elementary.outputs)) {
          safeElementary.outputs = node.data.elementary.outputs.map((item: any) => ({
            kind: item.kind === "waste" || item.kind === "emissions" ? item.kind : "waste",
            name: item.name || "migrierter Output",
            amount: Number(item.amount) || 1,
            unit: item.unit || "kg",
            datasetId: item.datasetId
          }));
        }
        
        hasChanges = true;
      }

      return {
        ...node,
        data: {
          ...node.data,
          elementary: safeElementary
        }
      };
    });

    if (hasChanges) {
      // Save migrated data
      localStorage.setItem("pcf_graph_v1", JSON.stringify({ ...data, nodes }));
      console.log("Successfully migrated elementary flows");
    } else {
      console.log("No changes needed for elementary flows");
    }
  } catch (error) {
    console.error("Error migrating elementary flows:", error);
  }
}
