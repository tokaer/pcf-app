import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function pcfRoutes(app: FastifyInstance) {
  app.post("/api/pcf/compute", async (req) => {
    const body = req.body as { nodes: any[]; edges: any[] };

    const datasetIds = Array.from(
      new Set((body.edges ?? []).map((e: any) => e?.data?.datasetId).filter(Boolean))
    );

    const datasets = await prisma.dataset.findMany({
      where: { id: { in: datasetIds as number[] } },
    });
    const byId = new Map(datasets.map((d) => [d.id, d] as const));

    let total = 0;
    const hotspots: { label: string; value: number }[] = [];

    for (const e of body.edges ?? []) {
      const ds = byId.get(e?.data?.datasetId);
      if (!ds) continue;
      const kg = (e?.data?.amount ?? 0) * ds.valueCO2e;
      total += kg;
      hotspots.push({ label: `${ds.name}`, value: kg });
    }

    hotspots.sort((a, b) => b.value - a.value);
    return { totalKgCO2e: Number(total.toFixed(4)), hotspots: hotspots.slice(0, 10) };
  });
}
