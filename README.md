# PCF App — Product Carbon Footprint Calculator

Eine webbasierte Anwendung zur Berechnung des **Product Carbon Footprint (PCF)** nach dem Prinzip der Lebenszyklusanalyse (LCA). Nutzer modellieren den Produktlebenszyklus als Prozessgraph, weisen Elementarflusse Emissionsfaktor-Datensatze zu und erhalten eine automatische CO2e-Bilanz mit Hotspot-Analyse.

---

## Inhaltsverzeichnis

- [Features](#features)
- [Architektur](#architektur)
- [Tech-Stack](#tech-stack)
- [Projektstruktur](#projektstruktur)
- [Voraussetzungen](#voraussetzungen)
- [Installation & Start](#installation--start)
- [Datenbank](#datenbank)
- [API-Endpunkte](#api-endpunkte)
- [State Management](#state-management)
- [PCF-Berechnung](#pcf-berechnung)
- [Scripts](#scripts)

---

## Features

### Canvas / Prozessgraph-Editor
- Visueller Graph-Editor auf Basis von **ReactFlow**
- Prozessmodule per Drag & Drop erstellen und verbinden
- Jedes Modul einer Lebenszyklusphase zuweisen (Rohstofferwerb, Produktion, Verteilung, Nutzung, End-of-Life)
- Elementarflusse (Inputs/Outputs) pro Prozess definieren
- Flusse zwischen Prozessen mit Menge und Einheit versehen

### Emissionsfaktor-Datenbank
- CRUD-Verwaltung von Emissionsfaktor-Datensatzen (kg CO2e pro Einheit)
- Filterung nach Quelle, Geografie und Name
- Kategorien: Material, Energie, Abfall, Emissionen
- Sortierbare Tabelle mit URL-basierter Persistenz

### Elementarfluss-Zuordnung
- Tabellarische Ubersicht aller Elementarflusse gruppiert nach Lebenszyklusphase
- Verknupfung jedes Flusses mit einem Emissionsfaktor-Datensatz
- Automatische Berechnung der CO2e-Emissionen pro Fluss

### Ergebnisse & Hotspot-Analyse
- Gesamt-PCF in kg CO2e
- Balkendiagramm der Emissionen nach Lebenszyklusphase
- Top-5-Ranking der emissionsintensivsten Prozessmodule
- Visuelle Hotspot-Darstellung mit relativen Balkenindikatoren

### Allgemeine Studienangaben
- Strukturiertes Formular fur LCA-Studiendokumentation
- Produktdefinition, funktionelle Einheit, Systemgrenzen
- Datenqualitat, Geografie, Zeitbezug
- Validierung uber Zod-Schemas

### Projektverwaltung
- Mehrere Projekte parallel verwalten
- Projektspezifische Persistenz aller Daten
- Umbenennen und Loschen von Projekten

---

## Architektur

```
┌─────────────────────────────────────────────────────┐
│                    Browser (SPA)                     │
│                                                      │
│  React + Vite + Tailwind                             │
│  ┌────────────┐ ┌────────────┐ ┌─────────────────┐  │
│  │  ReactFlow  │ │  Chart.js  │ │  Zustand Stores │  │
│  │  (Canvas)   │ │  (Charts)  │ │  (localStorage) │  │
│  └────────────┘ └────────────┘ └─────────────────┘  │
│                       │                              │
│              HTTP (fetch) │                           │
└───────────────────────┼──────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────┐
│                  API Server                           │
│                                                      │
│  Fastify + Prisma                                    │
│  ┌──────────────────┐  ┌──────────────┐              │
│  │  Dataset CRUD     │  │  PCF Compute │              │
│  │  /api/datasets    │  │  /api/pcf    │              │
│  └────────┬─────────┘  └──────────────┘              │
│           │                                          │
│     ┌─────┴─────┐                                    │
│     │  SQLite   │                                    │
│     │  (Prisma) │                                    │
│     └───────────┘                                    │
└──────────────────────────────────────────────────────┘
```

**Datenhaltung:**
- **Emissionsfaktor-Datensatze** werden serverseitig in SQLite gespeichert
- **Graphen, Projekte, Studienangaben** werden clientseitig im `localStorage` persistiert (projektspezifische Keys)

---

## Tech-Stack

### Frontend (`apps/web`)
| Technologie | Zweck |
|---|---|
| React 18 | UI-Framework |
| TypeScript | Typsicherheit |
| Vite | Build-Tool & Dev-Server |
| Tailwind CSS | Styling (Dark Theme) |
| ReactFlow (@xyflow/react) | Visueller Graph-Editor |
| Zustand | State Management |
| Chart.js + react-chartjs-2 | Diagramme |
| Zod | Schema-Validierung |
| React Router v6 | Client-Side Routing |
| Radix UI | Accessible UI-Primitives (Dialog, Toast, Popover) |
| Lucide React | Icons |

### Backend (`apps/api`)
| Technologie | Zweck |
|---|---|
| Fastify | HTTP-Server |
| TypeScript | Typsicherheit |
| Prisma | ORM & Migrations |
| SQLite | Datenbank |
| Zod | Request-Validierung |
| Swagger / Swagger UI | API-Dokumentation |

### Shared (`packages/types`)
| Technologie | Zweck |
|---|---|
| Zod | Gemeinsame Schemas (Process, Flow, Dataset, Graph, PcfResult) |
| TypeScript | Gemeinsame Typen |

---

## Projektstruktur

```
pcf-app/
├── package.json                 # Monorepo-Root (npm workspaces)
├── tsconfig.base.json           # Gemeinsame TS-Konfiguration
├── apps/
│   ├── api/                     # Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Datenbankschema
│   │   │   └── seed.ts          # Seed-Daten
│   │   └── src/
│   │       ├── index.ts         # Server-Entry + Dataset-Routes
│   │       └── routes/pcf.ts    # PCF-Compute-Endpoint
│   └── web/                     # Frontend
│       └── src/
│           ├── App.tsx           # Routing & Layout
│           ├── app/              # Seiten-Komponenten
│           │   ├── GeneralInfoPage.tsx
│           │   ├── CanvasPage.tsx
│           │   ├── ElementaryPage.tsx
│           │   ├── ResultsPage.tsx
│           │   └── DatabasePage.tsx
│           ├── canvas/           # ReactFlow Custom Nodes & Edges
│           ├── components/       # Shared UI-Komponenten
│           ├── db/api.ts         # HTTP-Client fur API-Aufrufe
│           ├── lib/              # Hilfsfunktionen & Typen
│           ├── state/            # Zustand Stores
│           └── types/            # TypeScript-Typdefinitionen
└── packages/
    └── types/                   # Geteiltes Types-Paket
        └── src/index.ts         # Zod-Schemas & exportierte Typen
```

---

## Voraussetzungen

- **Node.js** >= 20.19
- **npm** >= 10

---

## Installation & Start

```bash
# 1. Abhangigkeiten installieren
npm install

# 2. Datenbank initialisieren (SQLite)
npm -w apps/api run db:push

# 3. Optional: Seed-Daten laden
npm -w apps/api run db:seed

# 4. Entwicklungsserver starten (Frontend + Backend)
npm run dev
```

### Ports

| Service | URL |
|---|---|
| Web-App | http://localhost:5173 |
| API | http://localhost:8080 |
| Swagger-Docs | http://localhost:8080/docs |

---

## Datenbank

### Schema (SQLite via Prisma)

```
Method          Dataset              Project          Graph
┌──────────┐   ┌──────────────┐     ┌──────────┐    ┌──────────────┐
│ id (PK)  │   │ id (PK)      │     │ id (PK)  │    │ id (PK)      │
│ name     │◄──│ methodId (FK)│     │ name     │    │ name         │
│ gwpSet   │   │ name         │     │ methodId │    │ json (blob)  │
│ desc     │   │ source       │     └──────────┘    │ projectId FK │
└──────────┘   │ year         │          │           │ createdAt    │
               │ geo          │          └───────────│              │
               │ unit         │                      └──────────────┘
               │ valueCO2e    │
               │ kind         │
               └──────────────┘
```

- **Method**: Bewertungsmethode (z.B. GWP100)
- **Dataset**: Emissionsfaktor-Datensatz mit CO2e-Wert pro Einheit
- **Project**: LCA-Projekt, optional mit Methoden-Referenz
- **Graph**: Serialisierter ReactFlow-Zustand als JSON-Blob

### Unterstutzte Einheiten

`kg`, `t`, `kWh`, `MJ`, `l`, `m3`, `tkm`

### Dataset-Kategorien (kind)

| Wert | Beschreibung |
|---|---|
| `material` | Materialinput |
| `energy` | Energieinput |
| `waste` | Abfalloutput |
| `emissions` | Direkte Emissionen |

---

## API-Endpunkte

### Datasets

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/api/datasets` | Alle Datensatze auflisten (Filter: `source`, `geo`, `name`) |
| `POST` | `/api/datasets` | Neuen Datensatz erstellen |
| `PUT` | `/api/datasets/:id` | Datensatz aktualisieren |
| `DELETE` | `/api/datasets/:id` | Datensatz loschen |

### PCF-Berechnung

| Methode | Pfad | Beschreibung |
|---|---|---|
| `POST` | `/api/pcf/compute` | PCF berechnen (Input: Nodes + Edges, Output: totalKgCO2e + Hotspots) |

### Sonstige

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/health` | Health-Check |
| `GET` | `/debug/datasets` | Debug: Alle Datensatze ungefiltert |

Die vollstandige API-Dokumentation ist unter http://localhost:8080/docs (Swagger UI) verfugbar.

---

## State Management

Die App nutzt **Zustand** mit `localStorage`-Persistenz. Jeder Store verwendet projektspezifische Keys, damit mehrere Projekte unabhangig voneinander existieren.

| Store | Key-Muster | Inhalt |
|---|---|---|
| `useProjectsStore` | `pcf_projects_v1` | Projektliste & ausgewahltes Projekt |
| `useGraph` | `flowState_{projectId}` | ReactFlow-Nodes & -Edges (debounced save) |
| `useProject` | `pcf_report_{projectId}` | Report/Studienangaben |
| `useDatasetSelections` | `pcf_datasets_{projectId}` | Zuordnung Elementarfluss → Datensatz-ID |
| GeneralInfoPage | `pcf:general:{projectId}` | Allgemeine Studieninformationen (lokaler State) |

---

## PCF-Berechnung

Die CO2e-Berechnung erfolgt **clientseitig** in Echtzeit:

```
Fur jeden Prozessknoten:
  phase = Lebenszyklusphase des Knotens (material | production | distribution | use | eol)

  Fur jeden Elementarfluss (Inputs + Outputs):
    Falls datasetId zugewiesen:
      dataset = Emissionsfaktor-Datensatz nachschlagen
      emission = fluss.menge × dataset.valueCO2e    // in kg CO2e
      phasenEmissionen[phase] += emission
      gesamtEmissionen += emission

Ergebnis:
  - Gesamt-PCF in kg CO2e
  - Emissionen pro Lebenszyklusphase (fur Balkendiagramm)
  - Top-5 emissionsintensivste Prozesse (fur Hotspot-Ranking)
```

**Hinweis:** Es findet keine automatische Einheitenumrechnung statt. Der Nutzer muss sicherstellen, dass die Menge des Elementarflusses zur Einheit des Datensatzes passt.

---

## Scripts

| Script | Befehl | Beschreibung |
|---|---|---|
| Dev | `npm run dev` | Web + API gleichzeitig starten |
| Dev (nur Web) | `npm run dev:web` | Nur Frontend starten |
| Dev (nur API) | `npm run dev:api` | Nur Backend starten |
| Build | `npm run build` | Web + API bauen |
| Typecheck | `npm run typecheck` | TypeScript-Prufung |
| Format | `npm run format` | Prettier-Formatierung |
| DB Push | `npm -w apps/api run db:push` | Prisma-Schema auf DB anwenden |
| DB Seed | `npm -w apps/api run db:seed` | Seed-Daten laden |
| Prisma Generate | `npm -w apps/api run prisma:generate` | Prisma-Client generieren |
