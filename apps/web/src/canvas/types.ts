export type ProcessNodeData = {
  title: string;
  functionalUnit: string;
  params: Record<string, number | string>;
};

export type FlowEdgeData = {
  quantity: number;
  unit: string;
};
