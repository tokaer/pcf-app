## pcf-app Monorepo

Requirements
- Node.js >= 20.19
- npm >= 10

Workspaces
- apps/web: React + TypeScript + Vite + Tailwind v4
- apps/api: Fastify + TypeScript + Prisma (SQLite)
- packages/types: Shared TypeScript types and zod schemas

Setup
1. Install dependencies
   ```bash
   npm install
   ```
2. Start both apps (web + api)
   ```bash
   npm run dev
   ```

Ports
- Web: http://localhost:5173
- API: http://localhost:8080
- API Docs (Swagger): http://localhost:8080/docs

First steps
- Open http://localhost:5173 to see the web app
- Open http://localhost:8080/health to verify the API
- Use the Canvas tab to edit the sample graph. Use the buttons to save or load from LocalStorage.

Scripts
- dev: run web and api concurrently
- build: build web and api
- typecheck: TypeScript checks for web and api
- format: Prettier format

### API seeding checklist
1. Install tsx in the API workspace (if not already installed):
   ```bash
   npm -w apps/api i -D tsx
   ```
2. Run the Prisma seed via npm script:
   ```bash
   npm -w apps/api run db:seed
   ```
3. Expected output:
   - Database push (if needed) succeeded
   - "Seeding finished." or no errors

### Dataset Kind Bug Fix
The bug where dataset "kind" would reset to "Material" after switching to balance/results has been fixed.

#### Changes made:
- Added "kind" field to Zod schema in POST/PUT /api/datasets endpoints
- Implemented normalization for kind values (material, energy, waste, emissions)
- Removed unused datasets.ts route file

#### Manual Testing Plan:
1. Create four datasets with different kinds:
   - Material (or leave default)
   - Energie/Energy
   - Abfall/Waste
   - Emissionen/Emissions
2. Verify via GET /api/datasets that kinds are saved correctly
3. Switch to balance/results view
4. Return to dataset view and confirm kinds are preserved
