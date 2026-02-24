// Script to update dataset ID in the graph
const graphKey = "pcf_graph_default"; // or the specific project ID's key
const raw = localStorage.getItem(graphKey);
if (!raw) {
  console.log("No graph found");
  process.exit(1);
}

const graph = JSON.parse(raw);
let updated = false;

// Update nodes
graph.nodes = graph.nodes.map((node: any) => {
  if (node.data?.elementary?.outflows) {
    node.data.elementary.outflows = node.data.elementary.outflows.map((flow: any) => {
      if (flow.name === "Abfall" && flow.datasetId === 3) {
        flow.datasetId = 4; // Update to correct dataset ID
        updated = true;
      }
      return flow;
    });
  }
  return node;
});

if (updated) {
  localStorage.setItem(graphKey, JSON.stringify(graph));
  console.log("Updated dataset ID for Abfall flow");
} else {
  console.log("No matching flow found");
}
