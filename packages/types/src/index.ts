import { z } from "zod";

export const MethodSchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  gwpSet: z.string().optional(),
  description: z.string().optional(),
});
export type Method = z.infer<typeof MethodSchema>;

export const DatasetSchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  source: z.string().optional(),
  year: z.number().int().optional(),
  geo: z.string().optional(),
  unit: z.string(),
  valueCO2e: z.number(),
  methodId: z.number().int().optional(),
});
export type Dataset = z.infer<typeof DatasetSchema>;

export const ProcessParamSchema = z.record(z.union([z.string(), z.number()]));

export const ProcessSchema = z.object({
  id: z.string(),
  title: z.string(),
  functionalUnit: z.string().default("unit"),
  params: ProcessParamSchema.default({}),
});
export type Process = z.infer<typeof ProcessSchema>;

export const FlowSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  quantity: z.number().default(1),
  unit: z.string().default("kg"),
  datasetId: z.number().int().optional(),
  datasetName: z.string().optional(),
});
export type Flow = z.infer<typeof FlowSchema>;

export const GraphSchema = z.object({
  processes: z.array(ProcessSchema),
  flows: z.array(FlowSchema),
});
export type Graph = z.infer<typeof GraphSchema>;

export const HotspotSchema = z.object({
  processId: z.string(),
  processTitle: z.string(),
  contributionKgCO2e: z.number(),
});

export const PcfResultSchema = z.object({
  totalKgCO2e: z.number(),
  hotspots: z.array(HotspotSchema),
});
export type PcfResult = z.infer<typeof PcfResultSchema>;

export const ComputeRequestSchema = GraphSchema;
