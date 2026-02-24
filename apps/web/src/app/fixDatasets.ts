import { useGraph } from "@/state/graph";

export function fixDatasets() {
  const { nodes, setNodes, save } = useGraph.getState();
  let updated = false;

  const updatedNodes = nodes.map(node => {
    if (!node.data?.elementary?.outflows) return node;

    const outflows = node.data.elementary.outflows.map(flow => {
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
            outflows
          }
        }
      };
    }

    return node;
  });

  if (updated) {
    setNodes(updatedNodes);
    save();
    console.log("Updated Abfall dataset from ID 3 to 4");
  }
}
