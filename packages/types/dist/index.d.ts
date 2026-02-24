import { z } from "zod";
export declare const MethodSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodNumber>;
    name: z.ZodString;
    gwpSet: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id?: number | undefined;
    gwpSet?: string | undefined;
    description?: string | undefined;
}, {
    name: string;
    id?: number | undefined;
    gwpSet?: string | undefined;
    description?: string | undefined;
}>;
export type Method = z.infer<typeof MethodSchema>;
export declare const DatasetSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodNumber>;
    name: z.ZodString;
    source: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodNumber>;
    geo: z.ZodOptional<z.ZodString>;
    unit: z.ZodString;
    valueCO2e: z.ZodNumber;
    methodId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    unit: string;
    valueCO2e: number;
    id?: number | undefined;
    source?: string | undefined;
    year?: number | undefined;
    geo?: string | undefined;
    methodId?: number | undefined;
}, {
    name: string;
    unit: string;
    valueCO2e: number;
    id?: number | undefined;
    source?: string | undefined;
    year?: number | undefined;
    geo?: string | undefined;
    methodId?: number | undefined;
}>;
export type Dataset = z.infer<typeof DatasetSchema>;
export declare const ProcessParamSchema: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
export declare const ProcessSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    functionalUnit: z.ZodDefault<z.ZodString>;
    params: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber]>>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    params: Record<string, string | number>;
    title: string;
    functionalUnit: string;
}, {
    id: string;
    title: string;
    params?: Record<string, string | number> | undefined;
    functionalUnit?: string | undefined;
}>;
export type Process = z.infer<typeof ProcessSchema>;
export declare const FlowSchema: z.ZodObject<{
    id: z.ZodString;
    from: z.ZodString;
    to: z.ZodString;
    quantity: z.ZodDefault<z.ZodNumber>;
    unit: z.ZodDefault<z.ZodString>;
    datasetId: z.ZodOptional<z.ZodNumber>;
    datasetName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    unit: string;
    from: string;
    to: string;
    quantity: number;
    datasetId?: number | undefined;
    datasetName?: string | undefined;
}, {
    id: string;
    from: string;
    to: string;
    unit?: string | undefined;
    quantity?: number | undefined;
    datasetId?: number | undefined;
    datasetName?: string | undefined;
}>;
export type Flow = z.infer<typeof FlowSchema>;
export declare const GraphSchema: z.ZodObject<{
    processes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        functionalUnit: z.ZodDefault<z.ZodString>;
        params: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber]>>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        params: Record<string, string | number>;
        title: string;
        functionalUnit: string;
    }, {
        id: string;
        title: string;
        params?: Record<string, string | number> | undefined;
        functionalUnit?: string | undefined;
    }>, "many">;
    flows: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        from: z.ZodString;
        to: z.ZodString;
        quantity: z.ZodDefault<z.ZodNumber>;
        unit: z.ZodDefault<z.ZodString>;
        datasetId: z.ZodOptional<z.ZodNumber>;
        datasetName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        unit: string;
        from: string;
        to: string;
        quantity: number;
        datasetId?: number | undefined;
        datasetName?: string | undefined;
    }, {
        id: string;
        from: string;
        to: string;
        unit?: string | undefined;
        quantity?: number | undefined;
        datasetId?: number | undefined;
        datasetName?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    processes: {
        id: string;
        params: Record<string, string | number>;
        title: string;
        functionalUnit: string;
    }[];
    flows: {
        id: string;
        unit: string;
        from: string;
        to: string;
        quantity: number;
        datasetId?: number | undefined;
        datasetName?: string | undefined;
    }[];
}, {
    processes: {
        id: string;
        title: string;
        params?: Record<string, string | number> | undefined;
        functionalUnit?: string | undefined;
    }[];
    flows: {
        id: string;
        from: string;
        to: string;
        unit?: string | undefined;
        quantity?: number | undefined;
        datasetId?: number | undefined;
        datasetName?: string | undefined;
    }[];
}>;
export type Graph = z.infer<typeof GraphSchema>;
export declare const HotspotSchema: z.ZodObject<{
    processId: z.ZodString;
    processTitle: z.ZodString;
    contributionKgCO2e: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    processId: string;
    processTitle: string;
    contributionKgCO2e: number;
}, {
    processId: string;
    processTitle: string;
    contributionKgCO2e: number;
}>;
export declare const PcfResultSchema: z.ZodObject<{
    totalKgCO2e: z.ZodNumber;
    hotspots: z.ZodArray<z.ZodObject<{
        processId: z.ZodString;
        processTitle: z.ZodString;
        contributionKgCO2e: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        processId: string;
        processTitle: string;
        contributionKgCO2e: number;
    }, {
        processId: string;
        processTitle: string;
        contributionKgCO2e: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    totalKgCO2e: number;
    hotspots: {
        processId: string;
        processTitle: string;
        contributionKgCO2e: number;
    }[];
}, {
    totalKgCO2e: number;
    hotspots: {
        processId: string;
        processTitle: string;
        contributionKgCO2e: number;
    }[];
}>;
export type PcfResult = z.infer<typeof PcfResultSchema>;
export declare const ComputeRequestSchema: z.ZodObject<{
    processes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        functionalUnit: z.ZodDefault<z.ZodString>;
        params: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber]>>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        params: Record<string, string | number>;
        title: string;
        functionalUnit: string;
    }, {
        id: string;
        title: string;
        params?: Record<string, string | number> | undefined;
        functionalUnit?: string | undefined;
    }>, "many">;
    flows: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        from: z.ZodString;
        to: z.ZodString;
        quantity: z.ZodDefault<z.ZodNumber>;
        unit: z.ZodDefault<z.ZodString>;
        datasetId: z.ZodOptional<z.ZodNumber>;
        datasetName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        unit: string;
        from: string;
        to: string;
        quantity: number;
        datasetId?: number | undefined;
        datasetName?: string | undefined;
    }, {
        id: string;
        from: string;
        to: string;
        unit?: string | undefined;
        quantity?: number | undefined;
        datasetId?: number | undefined;
        datasetName?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    processes: {
        id: string;
        params: Record<string, string | number>;
        title: string;
        functionalUnit: string;
    }[];
    flows: {
        id: string;
        unit: string;
        from: string;
        to: string;
        quantity: number;
        datasetId?: number | undefined;
        datasetName?: string | undefined;
    }[];
}, {
    processes: {
        id: string;
        title: string;
        params?: Record<string, string | number> | undefined;
        functionalUnit?: string | undefined;
    }[];
    flows: {
        id: string;
        from: string;
        to: string;
        unit?: string | undefined;
        quantity?: number | undefined;
        datasetId?: number | undefined;
        datasetName?: string | undefined;
    }[];
}>;
