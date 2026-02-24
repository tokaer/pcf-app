import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useProjectsStore } from "@/state/projects";

// Typen und Schema
export const SystemTypeEnum = z.enum(["cradle_to_grave", "cradle_to_gate", "gate_to_gate"]);
export const UnitKindEnum = z.enum(["FU", "DU"]);
export const ProcessModuleEnum = z.enum(["material", "production", "distribution", "use", "eol"]);
export const GeoRepEnum = z.enum(["local", "regional", "global"]);
export const DataSourceTypeEnum = z.enum(["primary", "secondary", "mix"]);

export const StudyInfoSchema = z.object({
  product: z.object({
    name: z.string().optional().default(""),
    description: z.string().optional().default(""),
    category: z.string().optional().default(""),
  }),
  unit: z.object({
    kind: UnitKindEnum,
    definition: z.string().optional().default(""),
    referenceFlow: z.string().optional().default(""),
    hasComparison: z.boolean().optional().default(false),
  }),
  boundary: z.object({
    systemType: SystemTypeEnum,
    geography: z.string().optional().default(""),
    modules: z.array(ProcessModuleEnum).default([]),
    exclusions: z.object({ 
      text: z.string().optional().default(""), 
      reason: z.string().optional().default("") 
    }),
    cutoff: z.number().min(0).max(100).optional(),
  }),
  dataQuality: z.object({
    sourceType: DataSourceTypeEnum,
    sourceNote: z.string().optional().default(""),
    time: z.string().optional().default(""),
    geoRep: GeoRepEnum.optional(),
    techRep: z.string().optional().default(""),
    rating: z.object({
      accuracy: z.boolean().optional().default(false),
      completeness: z.boolean().optional().default(false),
      consistency: z.boolean().optional().default(false),
    }).optional(),
  }),
  timeframe: z.object({
    startYear: z.number().int().optional(),
    endYear: z.number().int().optional(),
    isRepresentativeAverage: z.boolean().optional().default(false),
    seasonalNotes: z.string().optional().default(""),
  }),
});

export type StudyInfo = z.infer<typeof StudyInfoSchema>;

const DEFAULTS: StudyInfo = {
  product: {
    name: "",
    description: "",
    category: "",
  },
  unit: {
    kind: "FU",
    definition: "",
    referenceFlow: "",
    hasComparison: false,
  },
  boundary: {
    systemType: "cradle_to_grave",
    geography: "",
    modules: [],
    exclusions: {
      text: "",
      reason: "",
    },
    cutoff: undefined,
  },
  dataQuality: {
    sourceType: "mix",
    sourceNote: "",
    time: "",
    geoRep: "global",
    techRep: "",
    rating: {
      accuracy: false,
      completeness: false,
      consistency: false,
    },
  },
  timeframe: {
    startYear: undefined,
    endYear: undefined,
    isRepresentativeAverage: false,
    seasonalNotes: "",
  },
};

const storageKey = (projectId?: string | null) => `pcf:general:${projectId ?? "default"}`;

export function GeneralInfoPage() {
  const { selectedId } = useProjectsStore();
  const { toast } = useToast();
  
  const key = useMemo(() => storageKey(selectedId), [selectedId]);
  const [model, setModel] = useState<StudyInfo>(DEFAULTS);
  
  // Load from localStorage on mount or when project changes
  useEffect(() => {
    console.log("Project changed, loading data for project:", selectedId);
    
    // Always reset to defaults first when project changes
    setModel(DEFAULTS);
    
    // Then try to load project-specific data
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsedData = JSON.parse(raw);
        setModel(parsedData);
        console.log("Loaded data for project", selectedId, parsedData);
      } catch (e) {
        console.error("Failed to parse stored data:", e);
      }
    } else {
      console.log("No saved data found for project", selectedId, "using defaults");
    }
  }, [key, selectedId]);
  
  // Immediate save effect when model changes
  useEffect(() => {
    // Don't save on initial render/mount
    if (model === DEFAULTS) return;

    console.log("Saving data for project:", selectedId, "with key:", key);
    localStorage.setItem(key, JSON.stringify(model));
  }, [model, key, selectedId]);
  
  // Generic field updater - no validation
  const updateField = <K extends string>(section: keyof StudyInfo, field: K, value: any) => {
    setModel(prev => {
      const updated = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
      return updated;
    });
  };
  
  // Specialized updater for nested fields - no validation
  const updateNestedField = <K extends string, N extends string>(
    section: keyof StudyInfo, 
    nestedSection: K, 
    field: N, 
    value: any
  ) => {
    setModel(prev => {
      const updated = {
        ...prev,
        [section]: {
          ...prev[section],
          [nestedSection]: {
            ...prev[section][nestedSection],
            [field]: value
          }
        }
      };
      return updated;
    });
  };
  
  
  return (
    <div className="max-w-5xl mx-auto bg-[#0a0a0a] text-white">
      <div className="sticky top-0 bg-[#0a0a0a] z-10 py-2 flex justify-between items-center border-b border-neutral-800 mb-6">
        <h2 className="text-xl font-semibold">Allgemeine Angaben {selectedId ? `(Projekt: ${selectedId})` : ''}</h2>
      </div>
      
      <div className="space-y-8 text-white">
        {/* Sektion 1: Produktdefinition & Funktion */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
                          <h3 className="text-lg font-medium">1. Produktdefinition & Funktion</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">
                Produktname / ID
              </Label>
              <Input 
                id="product-name" 
                value={model.product.name} 
                onChange={(e) => updateField("product", "name", e.target.value)}
                className="border-neutral-700 bg-neutral-800 text-white font-sans text-sm"
              />

            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-description">
                Beschreibung & Hauptfunktionen
              </Label>
              <textarea 
                id="product-description" 
                value={model.product.description}
                onChange={(e) => updateField("product", "description", e.target.value)}
                rows={3}
                className="w-full border border-neutral-700 bg-neutral-800 rounded-md px-3 py-2 text-white font-sans text-sm"
              />

            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-category">Produkttyp / Kategorie</Label>
              <Input 
                id="product-category" 
                value={model.product.category || ""} 
                onChange={(e) => updateField("product", "category", e.target.value)}
                placeholder="z.B. für PKR/PEFCR"
                className="border-neutral-700 bg-neutral-800 text-white font-sans text-sm"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Sektion 2: Funktionelle oder deklarierte Einheit */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
                          <h3 className="text-lg font-medium">2. Funktionelle oder deklarierte Einheit (FU/DU)</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                Art der Einheit
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    id="unit-fu" 
                    name="unit-kind"
                    checked={model.unit.kind === "FU"}
                    onChange={() => updateField("unit", "kind", "FU")}
                  />
                  <Label htmlFor="unit-fu">Funktionelle Einheit (FU)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    id="unit-du" 
                    name="unit-kind"
                    checked={model.unit.kind === "DU"}
                    onChange={() => updateField("unit", "kind", "DU")}
                  />
                  <Label htmlFor="unit-du">Deklarierte Einheit (DU)</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unit-definition">
                Definition der FU/DU
              </Label>
              <textarea 
                id="unit-definition" 
                value={model.unit.definition}
                onChange={(e) => updateField("unit", "definition", e.target.value)}
                placeholder="inkl. Service, Dauer, Qualitätsniveau"
                rows={3}
                className="w-full border border-neutral-700 bg-neutral-800 rounded-md px-3 py-2 text-white font-sans text-sm"
              />

            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reference-flow">Referenzfluss</Label>
              <Input 
                id="reference-flow" 
                value={model.unit.referenceFlow || ""} 
                onChange={(e) => updateField("unit", "referenceFlow", e.target.value)}
                placeholder="z.B. 1 kg Produkt"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has-comparison"
                checked={model.unit.hasComparison || false}
                onChange={(e) => updateField("unit", "hasComparison", e.target.checked)}
                className="mr-2 bg-neutral-800 border-neutral-700 text-emerald-600"
              />
              <Label htmlFor="has-comparison">Vergleich geplant?</Label>
            </div>
          </CardContent>
        </Card>
        
        {/* Sektion 3: Systemgrenze */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
                          <h3 className="text-lg font-medium">3. Systemgrenze</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="system-type">
                Systemtyp
              </Label>
              <select 
                id="system-type"
                value={model.boundary.systemType} 
                onChange={(e) => updateField("boundary", "systemType", e.target.value as any)}
                className="w-full border border-neutral-700 bg-neutral-800 rounded-md px-3 py-2 text-white font-sans text-sm"
              >
                <option value="cradle_to_grave">Cradle-to-grave</option>
                <option value="cradle_to_gate">Cradle-to-gate</option>
                <option value="gate_to_gate">Gate-to-gate</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="geography">
                Geografischer Geltungsbereich
              </Label>
              <Input 
                id="geography" 
                value={model.boundary.geography} 
                onChange={(e) => updateField("boundary", "geography", e.target.value)}
                placeholder="Region/Land/Global"
              />

            </div>
            
            <div className="space-y-2">
              <Label>Einbezogene Prozessmodule</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["material", "production", "distribution", "use", "eol"] as const).map((module) => (
                  <div key={module} className="flex items-center gap-2">
                                    <input
                    type="checkbox"
                    id={`module-${module}`}
                    checked={model.boundary.modules.includes(module)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateField("boundary", "modules", [...model.boundary.modules, module]);
                      } else {
                        updateField("boundary", "modules", model.boundary.modules.filter(m => m !== module));
                      }
                    }}
                    className="mr-2 bg-neutral-800 border-neutral-700 text-emerald-600"
                  />
                    <Label htmlFor={`module-${module}`}>
                      {module === "material" && "Rohstofferwerb"}
                      {module === "production" && "Produktion"}
                      {module === "distribution" && "Verteilung"}
                      {module === "use" && "Nutzung"}
                      {module === "eol" && "Behandlung am Ende des Lebenswegs"}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="exclusions">Ausschlüsse</Label>
              <textarea 
                id="exclusions" 
                value={model.boundary.exclusions.text || ""} 
                onChange={(e) => updateNestedField("boundary", "exclusions", "text", e.target.value)}
                placeholder="Ausgeschlossene Prozesse oder Materialien"
                className="w-full border border-neutral-700 bg-neutral-800 rounded-md px-3 py-2 text-white font-sans text-sm"
                rows={3}
              />
            </div>
            
            {model.boundary.exclusions.text && (
              <div className="space-y-2">
                <Label htmlFor="exclusion-reason">
                  Begründung für Ausschlüsse
                </Label>
                <textarea 
                  id="exclusion-reason" 
                  value={model.boundary.exclusions.reason || ""} 
                  onChange={(e) => updateNestedField("boundary", "exclusions", "reason", e.target.value)}
                  className="w-full border border-neutral-700 bg-neutral-800 rounded-md px-3 py-2 text-white font-sans text-sm"
                  rows={3}
                />
  
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="cutoff">Abschneidekriterium (%)</Label>
              <Input 
                id="cutoff" 
                type="number" 
                min={0} 
                max={100}
                value={model.boundary.cutoff?.toString() || ""} 
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined;
                  updateField("boundary", "cutoff", value);
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Sektion 4: Daten & Datenqualität */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
                          <h3 className="text-lg font-medium">4. Daten & Datenqualität</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source-type">
                Primär-/Sekundärdaten Quellen
              </Label>
              <select 
                id="source-type"
                value={model.dataQuality.sourceType} 
                onChange={(e) => updateField("dataQuality", "sourceType", e.target.value as any)}
                className="w-full border border-neutral-700 bg-neutral-800 rounded-md px-3 py-2 text-white font-sans text-sm"
              >
                <option value="primary">Primärdaten</option>
                <option value="secondary">Sekundärdaten</option>
                <option value="mix">Gemischt</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source-note">Weitere Informationen zu Quellen</Label>
              <textarea 
                id="source-note" 
                value={model.dataQuality.sourceNote || ""} 
                onChange={(e) => updateField("dataQuality", "sourceNote", e.target.value)}
                className="w-full border border-neutral-700 bg-neutral-800 rounded-md px-3 py-2 text-white font-sans text-sm"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time-reference">
                Zeitbezug
              </Label>
              <Input 
                id="time-reference" 
                value={model.dataQuality.time} 
                onChange={(e) => updateField("dataQuality", "time", e.target.value)}
                placeholder="Jahr(e) oder Zeitraum"
              />

            </div>
            
            <div className="space-y-2">
              <Label htmlFor="geo-rep">Geografische Repräsentativität</Label>
              <select 
                id="geo-rep"
                value={model.dataQuality.geoRep || "global"} 
                onChange={(e) => updateField("dataQuality", "geoRep", e.target.value as any)}
                className="w-full border border-neutral-700 bg-neutral-800 rounded-md px-3 py-2 text-white font-sans text-sm"
              >
                <option value="local">Lokal</option>
                <option value="regional">Regional</option>
                <option value="global">Global</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tech-rep">Technologierepräsentativität</Label>
              <textarea 
                id="tech-rep" 
                value={model.dataQuality.techRep || ""} 
                onChange={(e) => updateField("dataQuality", "techRep", e.target.value)}
                className="w-full border border-neutral-700 bg-neutral-800 rounded-md px-3 py-2 text-white font-sans text-sm"
                rows={3}
              />
            </div>
            

          </CardContent>
        </Card>
        
        {/* Sektion 5: Zeitlicher Rahmen */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
                          <h3 className="text-lg font-medium">5. Zeitlicher Rahmen</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-year">Start-Jahr</Label>
                <Input 
                  id="start-year" 
                  type="number"
                  value={model.timeframe.startYear?.toString() || ""} 
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : undefined;
                    updateField("timeframe", "startYear", value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-year">End-Jahr</Label>
                <Input 
                  id="end-year" 
                  type="number"
                  value={model.timeframe.endYear?.toString() || ""} 
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : undefined;
                    updateField("timeframe", "endYear", value);
                  }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-representative-average"
                checked={model.timeframe.isRepresentativeAverage || false}
                onChange={(e) => updateField("timeframe", "isRepresentativeAverage", e.target.checked)}
                className="mr-2 bg-neutral-800 border-neutral-700 text-emerald-600"
              />
              <Label htmlFor="is-representative-average">Repräsentativer Durchschnitt</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="seasonal-notes">Saisonale Besonderheiten</Label>
              <textarea 
                id="seasonal-notes" 
                value={model.timeframe.seasonalNotes || ""} 
                onChange={(e) => updateField("timeframe", "seasonalNotes", e.target.value)}
                className="w-full border border-neutral-700 bg-neutral-800 rounded-md px-3 py-2 text-white font-sans text-sm"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
