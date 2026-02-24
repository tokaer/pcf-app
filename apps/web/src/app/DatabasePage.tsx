import { useEffect, useRef, useState, useMemo } from "react";
import { createDataset, listDatasets, deleteDataset, Dataset } from "@/db/api";
import { Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { EditDatasetDialog } from "@/components/EditDatasetDialog";
import { useSearchParams } from "react-router-dom";
import { SortDirection, SortKey, stableSort, comparators } from "@/utils/sort";

const sample = [
  { id: 1, name: "Strommix DE", source: "UBA", year: 2022, geo: "DE", unit: "kWh", value: 0.401, method: "GWP100" },
  { id: 2, name: "Diesel", source: "ecoinvent", year: 2020, geo: "EU", unit: "l", value: 2.68, method: "GWP100" },
  { id: 3, name: "LKW-Transport", source: "ecoinvent", year: 2020, geo: "EU", unit: "tkm", value: 0.12, method: "GWP100" },
];

// Speichern des zuletzt ausgewählten kind-Werts im localStorage
const LAST_KIND_KEY = "pcf_last_selected_kind";

// Funktion zum Laden des letzten kind-Werts aus localStorage
const getLastSelectedKind = (): string => {
  try {
    const savedKind = localStorage.getItem(LAST_KIND_KEY);
    return savedKind || "material";
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return "material";
  }
};

// Funktion zum Speichern des kind-Werts in localStorage
const saveSelectedKind = (kind: string): void => {
  try {
    localStorage.setItem(LAST_KIND_KEY, kind);
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
};

// Mapping of kind values to display labels
const kindLabels: Record<string, string> = {
  material: "Material",
  energy: "Energie",
  waste: "Abfall",
  emissions: "Emissionen"
};

export function DatabasePage() {
  const [rows, setRows] = useState<Dataset[]>(sample as any);
  const [form, setForm] = useState({ 
    name: "", 
    unit: "kg", 
    valueCO2e: "", 
    source: "", 
    year: "", 
    geo: "",
    kind: getLastSelectedKind()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<number | null>(null);
  
  // Get and set sort parameters from URL
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const key = searchParams.get("sort");
    return key as keyof Dataset | null;
  });
  const [sortDir, setSortDir] = useState<SortDirection>(() => {
    const dir = searchParams.get("dir");
    return (dir === "asc" || dir === "desc") ? dir : "none";
  });

  // Update URL when sort changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    
    if (sortKey && sortDir !== "none") {
      newParams.set("sort", sortKey);
      newParams.set("dir", sortDir);
    } else {
      newParams.delete("sort");
      newParams.delete("dir");
    }
    
    setSearchParams(newParams);
  }, [sortKey, sortDir, setSearchParams]);

  const showError = (msg: string) => {
    setError(msg);
    if (errorTimer.current) window.clearTimeout(errorTimer.current);
    errorTimer.current = window.setTimeout(() => setError(null), 3000);
  };

  const refresh = async () => {
    try {
      console.log("Fetching datasets from API...");
      const apiRows = await listDatasets();
      console.log("Received datasets:", apiRows);
      if (Array.isArray(apiRows)) {
        setRows(apiRows);
        console.log("Datasets updated in state");
      } else {
        console.warn("API returned non-array response:", apiRows);
      }
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  };

  // Immer aktualisieren, wenn die Komponente neu gerendert wird
  useEffect(() => { 
    console.log("DatabasePage: Refreshing data...");
    refresh(); 
  }, []);

  const onChange = (patch: Partial<typeof form>) => {
    // Protokollieren der Änderung
    console.log("Form change:", patch);
    
    setForm((f) => {
      const newForm = { ...f, ...patch };
      console.log("Updated form:", newForm);
      
      // Wenn sich der kind-Wert ändert, speichern wir ihn
      if (patch.kind) {
        saveSelectedKind(patch.kind);
      }
      
      return newForm;
    });
    
    if (error) setError(null);
  };

  const validate = () => {
    if (!form.name.trim()) return "Name ist erforderlich";
    if (!form.unit) return "Einheit ist erforderlich";
    if (!form.geo.trim()) return "Geographie ist erforderlich";
    const val = Number(form.valueCO2e);
    if (!Number.isFinite(val)) return "Emissionsfaktor muss numerisch sein";
    if (!form.source.trim()) return "Quelle ist erforderlich";
    if (!/^\d{4}$/.test(form.year)) return "Jahr (YYYY) ist erforderlich";
    if (!form.kind) return "Art ist erforderlich";
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) return showError(v);

    // Protokolliere den aktuellen Formularstatus
    console.log("Current form state:", form);
    console.log("Selected kind:", form.kind);

    const val = Number(form.valueCO2e);
    const temp = {
      id: `tmp-${Date.now()}`,
      name: form.name.trim(),
      unit: form.unit,
      geo: form.geo.trim(),
      valueCO2e: val,
      source: form.source.trim(),
      year: Number(form.year),
      kind: form.kind,
    } as any;

    console.log("Created temp entry with kind:", temp.kind);

    setLoading(true);
    setRows((r) => [temp, ...r]);

    try {
      // Speichern Sie den kind-Wert explizit in einer separaten Variablen
      const kindValue = form.kind;
      console.log("FORM STATE:", form);
      console.log("KIND VALUE FOR API REQUEST:", kindValue);
      console.log("KIND VALUE TYPE:", typeof kindValue);
      
      // Erstellen eines neuen Objekts mit expliziten Werten
      const dataToSend = {
        name: temp.name,
        unit: temp.unit,
        geo: temp.geo || "",
        valueCO2e: Number(temp.valueCO2e),
        source: temp.source || "",
        year: temp.year ? Number(temp.year) : undefined,
        // KRITISCH: Stellen Sie sicher, dass kind als String gesendet wird
        kind: kindValue, 
      };
      
      // Überprüfen, ob der kind-Wert korrekt ist
      console.log("Final data to send:", dataToSend);
      
      console.log("Sending dataset to API:", JSON.stringify(dataToSend));
      const created = await createDataset(dataToSend);
      console.log("API response:", created);
      
      // Überprüfen, ob der kind-Wert korrekt zurückgegeben wurde
      if (created.kind !== kindValue) {
        console.error(`Kind value mismatch! Sent: ${kindValue}, Received: ${created.kind}`);
      }
      
      setRows((r) => r.map((x) => (x.id === temp.id ? created : x)));
      
      // WICHTIG: Behalte den zuletzt ausgewählten kind-Wert bei
      // Wir setzen das Formular zurück, behalten aber den kind-Wert
      setForm(prev => ({ 
        name: "", 
        unit: "kg", 
        valueCO2e: "", 
        source: "", 
        year: "", 
        geo: "", 
        kind: prev.kind // Behalte den aktuellen kind-Wert
      }));
      
      console.log("Dispatching datasets:changed event");
      window.dispatchEvent(new Event("datasets:changed"));
    } catch (error) {
      console.error("Error creating dataset:", error);
      showError("Server nicht erreichbar – lokal hinzugefügt");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: any) => {
    if (typeof id !== "number") {
      // Temp-Eintrag: einfach lokal entfernen
      setRows((r) => r.filter((x) => x.id !== id));
      return;
    }
    
    console.log(`Attempting to delete dataset with ID: ${id}`);
    const prev = rows;
    
    // Optimistisch UI aktualisieren
    setRows((r) => r.filter((x) => x.id !== id));
    
    try {
      console.log(`Calling deleteDataset API for ID: ${id}`);
      const result = await deleteDataset(id);
      console.log(`Delete API result:`, result);
      
      // Daten neu laden
      console.log("Refreshing data after deletion");
      await refresh();
      
      console.log("Dispatching datasets:changed event");
      window.dispatchEvent(new Event("datasets:changed"));
    } catch (error) {
      // Rollback bei Fehlschlag
      console.error("Error deleting dataset:", error);
      setRows(prev);
      showError("Löschen fehlgeschlagen");
    }
  };

  // Handle dataset update from edit dialog
  const handleDatasetUpdate = (updatedDataset: Dataset) => {
    setRows(currentRows => 
      currentRows.map(row => 
        row.id === updatedDataset.id ? updatedDataset : row
      )
    );
  };

  // Handle column header click for sorting
  const handleSort = (key: keyof Dataset) => {
    if (sortKey === key) {
      // Toggle direction if already sorting by this key
      const nextDir = sortDir === "none" ? "asc" : sortDir === "asc" ? "desc" : "none";
      setSortDir(nextDir);
      if (nextDir === "none") {
        setSortKey(null);
      }
    } else {
      // Start with ascending sort for new key
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Render sort indicator based on current sort state
  const renderSortIndicator = (key: keyof Dataset) => {
    if (sortKey !== key) return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    if (sortDir === "asc") return <ArrowUp size={14} className="ml-1" />;
    if (sortDir === "desc") return <ArrowDown size={14} className="ml-1" />;
    return null;
  };

  // Apply sorting to rows
  const sortedRows = useMemo(() => {
    if (!sortKey || sortDir === "none") return rows;
    return stableSort(rows, sortKey, sortDir, comparators);
  }, [rows, sortKey, sortDir]);

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900 text-white">
      <div className="p-4 space-y-4">
        <div className="text-lg font-medium">Datasets</div>

        <div className="rounded border border-neutral-800 p-3">
          <div className="text-sm mb-2">Neuen Datensatz hinzufügen</div>
          {error && <div className="text-xs text-red-400 mb-2">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-sm">
            <input placeholder="Name" className="bg-neutral-800 rounded px-2 py-1" value={form.name} onChange={(e)=>onChange({name:e.target.value})} />
            <select className="bg-neutral-800 rounded px-2 py-1" value={form.unit} onChange={(e)=>onChange({unit:e.target.value})}>
              {(["kg","t","kWh","MJ","l","m3","tkm"] as const).map(u=> <option key={u} value={u}>{u}</option>)}
            </select>
            <input placeholder="Geographie" className="bg-neutral-800 rounded px-2 py-1" value={form.geo} onChange={(e)=>onChange({geo:e.target.value})} />
            <input placeholder="Emissionsfaktor" type="number" step="0.0001" className="bg-neutral-800 rounded px-2 py-1" value={form.valueCO2e} onChange={(e)=>onChange({valueCO2e:e.target.value})} />
            <input placeholder="Quelle" className="bg-neutral-800 rounded px-2 py-1" value={form.source} onChange={(e)=>onChange({source:e.target.value})} />
            <input placeholder="Jahr" type="number" className="bg-neutral-800 rounded px-2 py-1" value={form.year} onChange={(e)=>onChange({year:e.target.value})} />
            <select 
              className="bg-neutral-800 rounded px-2 py-1" 
              value={form.kind} 
              onChange={(e) => {
                const selectedValue = e.target.value;
                console.log("KIND SELECT CHANGED TO:", selectedValue);
                console.log("KIND SELECT VALUE TYPE:", typeof selectedValue);
                onChange({kind: selectedValue});
              }}
            >
              <option value="material">Material</option>
              <option value="energy">Energie</option>
              <option value="waste">Abfall</option>
              <option value="emissions">Emissionen</option>
            </select>
            <div className="col-span-7 flex gap-2">
              <button disabled={loading} onClick={submit} className="px-3 py-1.5 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700">
                {loading ? "Speichern..." : "Hinzufügen"}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-sm min-w-max">
            <thead className="bg-neutral-800 text-neutral-200">
              <tr>
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-neutral-700"
                  onClick={() => handleSort("name")}
                  aria-sort={sortKey === "name" ? sortDir : "none"}
                >
                  <div className="flex items-center">
                    Name
                    {renderSortIndicator("name")}
                  </div>
                </th>
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-neutral-700"
                  onClick={() => handleSort("unit")}
                  aria-sort={sortKey === "unit" ? sortDir : "none"}
                >
                  <div className="flex items-center">
                    Einheit
                    {renderSortIndicator("unit")}
                  </div>
                </th>
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-neutral-700"
                  onClick={() => handleSort("geo")}
                  aria-sort={sortKey === "geo" ? sortDir : "none"}
                >
                  <div className="flex items-center">
                    Geographie
                    {renderSortIndicator("geo")}
                  </div>
                </th>
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-neutral-700"
                  onClick={() => handleSort("valueCO2e")}
                  aria-sort={sortKey === "valueCO2e" ? sortDir : "none"}
                >
                  <div className="flex items-center">
                    Emissionsfaktor [kgCO2e/Einheit]
                    {renderSortIndicator("valueCO2e")}
                  </div>
                </th>
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-neutral-700"
                  onClick={() => handleSort("source")}
                  aria-sort={sortKey === "source" ? sortDir : "none"}
                >
                  <div className="flex items-center">
                    Quelle
                    {renderSortIndicator("source")}
                  </div>
                </th>
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-neutral-700"
                  onClick={() => handleSort("year")}
                  aria-sort={sortKey === "year" ? sortDir : "none"}
                >
                  <div className="flex items-center">
                    Jahr
                    {renderSortIndicator("year")}
                  </div>
                </th>
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-neutral-700"
                  onClick={() => handleSort("kind")}
                  aria-sort={sortKey === "kind" ? sortDir : "none"}
                >
                  <div className="flex items-center">
                    Art
                    {renderSortIndicator("kind")}
                  </div>
                </th>
                <th className="text-left p-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => (
                <tr key={r.id ?? r.name} className="border-t border-neutral-800">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.unit}</td>
                  <td className="p-2">{r.geo ?? "—"}</td>
                  <td className="p-2">{r.valueCO2e ?? r.value}</td>
                  <td className="p-2">{r.source ?? "—"}</td>
                  <td className="p-2">{r.year ?? "—"}</td>
                  <td className="p-2">{kindLabels[r.kind] || "—"}</td>
                  <td className="p-2 flex">
                    {r.id ? (
                      <>
                        <button 
                          onClick={()=>remove(r.id)} 
                          className="p-1.5 rounded border border-red-700 text-red-400 hover:bg-red-900/20" 
                          title="Löschen"
                        >
                          <Trash2 size={16} />
                        </button>
                        <EditDatasetDialog 
                          dataset={r} 
                          onSaved={handleDatasetUpdate} 
                        />
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}