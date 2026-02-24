export type Unit =
  | "kg" | "t"           // Masse
  | "kWh" | "MJ"         // Energie
  | "l" | "m3" | "tkm";  // sonstige Beispiele

export type InputFlowKind = "material" | "energy";
export type OutputFlowKind = "waste" | "emissions";
export type FlowKind = InputFlowKind | OutputFlowKind;

export type FlowData = {
  name: string;      // Name des Flusses
  amount: number;    // Menge
  unit: Unit;        // Einheit
};

export type ElementaryItem = {
  kind: FlowKind;
  name: string;      // Stoff/Energieträger
  amount: number;
  unit: Unit;
  datasetId?: number;
};

export type ProcessData = {
  title: string;
  stage: "material" | "production" | "distribution" | "use" | "eol";
  elementary?: {
    inputs: ElementaryItem[];
    outputs: ElementaryItem[];
  };
};
