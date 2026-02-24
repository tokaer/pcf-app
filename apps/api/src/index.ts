import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { pcfRoutes } from "./routes/pcf";

const prisma = new PrismaClient();

const server = Fastify({ logger: true });

await server.register(cors, { origin: true });
await server.register(swagger, { openapi: { info: { title: "PCF API", version: "0.1.0" } } });
await server.register(swaggerUi, { routePrefix: "/docs" });

server.get("/health", async () => ({ status: "ok" }));

server.get("/debug/datasets", async () => {
  const datasets = await prisma.dataset.findMany();
  return datasets;
});

server.get("/api/datasets", async (req, reply) => {
  const qSchema = z.object({ source: z.string().optional(), geo: z.string().optional(), name: z.string().optional() });
  const query = qSchema.parse((req as any).query ?? {});
  const where: any = {};
  if (query.source) where.source = { contains: query.source };
  if (query.geo) where.geo = { contains: query.geo };
  if (query.name) where.name = { contains: query.name };
  const rows = await prisma.dataset.findMany({ where, orderBy: { id: "asc" } });
  return rows;
});

// Helper function to normalize kind values
function normalizeKind(kind: string | undefined): string {
  if (!kind) return "material"; // Default value
  
  const normalizedKind = kind.trim().toLowerCase();
  if (normalizedKind === "energy" || normalizedKind === "energie") {
    return "energy";
  } else if (normalizedKind === "waste" || normalizedKind === "abfall") {
    return "waste";
  } else if (normalizedKind === "emissions" || normalizedKind === "emissionen") {
    return "emissions";
  }
  return "material"; // Default fallback
}

server.post("/api/datasets", async (req, reply) => {
  const body = z.object({ 
    name: z.string(), 
    source: z.string().optional(), 
    year: z.number().int().optional(), 
    geo: z.string().optional(), 
    unit: z.string(), 
    valueCO2e: z.number(), 
    methodId: z.number().int().optional(),
    kind: z.string().optional()
  }).parse((req as any).body);
  
  // Normalize and include kind in the data
  const dataToCreate = {
    ...body,
    kind: normalizeKind(body.kind)
  };
  
  const created = await prisma.dataset.create({ data: dataToCreate });
  return created;
});

server.put("/api/datasets/:id", async (req, reply) => {
  const params = z.object({ id: z.coerce.number().int() }).parse((req as any).params);
  const body = z.object({ 
    name: z.string().optional(), 
    source: z.string().optional(), 
    year: z.number().int().optional(), 
    geo: z.string().optional(), 
    unit: z.string().optional(), 
    valueCO2e: z.number().optional(), 
    methodId: z.number().int().optional(),
    kind: z.string().optional()
  }).parse((req as any).body);
  
  // Prepare update data, normalizing kind if provided
  const updateData = { ...body };
  if (body.kind !== undefined) {
    updateData.kind = normalizeKind(body.kind);
  }
  
  const updated = await prisma.dataset.update({ where: { id: params.id }, data: updateData });
  return updated;
});

server.delete("/api/datasets/:id", async (req, reply) => {
  const params = z.object({ id: z.coerce.number().int() }).parse((req as any).params);
  await prisma.dataset.delete({ where: { id: params.id } });
  return { ok: true };
});

await pcfRoutes(server);

const host = "0.0.0.0";
const port = 8080;

try {
  await server.listen({ host, port });
  server.log.info(`listening on http://${host}:${port}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
