import { useState, useEffect, useRef } from "react";
import { useProjectsStore } from "@/state/projects";
import { Plus, ChevronLeft, ChevronRight, Trash2, Edit2, Check, Database, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type SidebarTab = "projects" | "database" | "settings";

export function SidebarProjects({ activeTab, setActiveTab, open, setOpen }: { activeTab: SidebarTab; setActiveTab: (tab: SidebarTab) => void; open: boolean; setOpen: (open: boolean) => void }) {
  const { projects, selectedId, create, select, remove, rename, load } = useProjectsStore();
  const navigate = useNavigate();
  
  // Only navigate to /allgemein when the project changes, not on other renders
  const prevSelectedIdRef = useRef(selectedId);
  useEffect(() => {
    // Only navigate if the selectedId actually changed (not on initial render)
    if (prevSelectedIdRef.current !== selectedId && selectedId !== null && activeTab === "projects") {
      console.log("Project selection changed in sidebar, navigating to /allgemein");
      navigate("/allgemein");
    }
    prevSelectedIdRef.current = selectedId;
  }, [selectedId, activeTab, navigate]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Initial load
  useEffect(() => { load(); }, []);

  return (
    <div className={`sidebar transition-all duration-200 fixed top-0 left-0 bottom-0 flex flex-col bg-neutral-900 border-r border-neutral-800 ${open ? "w-64" : "w-12"}`}>
      <div className="flex items-center justify-between p-2 border-b border-neutral-800">
        {open ? <span className="font-semibold text-sm text-neutral-200">Navigation</span> : null}
        <button onClick={() => {
          const newValue = !open;
          setOpen(newValue);
          localStorage.setItem('sidebar_open', String(newValue));
        }} className="p-1 rounded hover:bg-neutral-800">
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
      {open && (
        <div className="flex-1 overflow-y-auto">
          {/* Bilanzen */}
          <div className="mt-2 mb-4">
            <div className="text-xs uppercase tracking-wider text-neutral-400 px-3 mb-1">Bilanzen</div>
            <button onClick={() => create()} className="w-full flex items-center gap-2 px-3 py-2 text-sm border-b border-neutral-800 hover:bg-neutral-800">
              <Plus size={16} /> Neue Bilanz
            </button>
            <ul className="mt-1">
              {projects.map((p) => (
                <li key={p.id} className={`group flex items-center px-2 py-1.5 rounded cursor-pointer ${selectedId === p.id && activeTab === "projects" ? "bg-emerald-700/30" : "hover:bg-neutral-800"}`}>
                  {editId === p.id ? (
                    <>
                      <input
                        className="bg-neutral-800 rounded px-2 py-1 text-sm w-28 mr-1"
                        value={editName}
                        autoFocus
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { rename(p.id, editName); setEditId(null); } }}
                      />
                      <button className="p-1 text-emerald-400" onClick={() => { rename(p.id, editName); setEditId(null); }}><Check size={16} /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate" onClick={() => { select(p.id); setActiveTab("projects"); }}>{p.name}</span>
                      <button className="p-1 text-neutral-400 opacity-0 group-hover:opacity-100" onClick={() => { setEditId(p.id); setEditName(p.name); }} title="Umbenennen"><Edit2 size={15} /></button>
                      <button className="p-1 text-red-400 opacity-0 group-hover:opacity-100" onClick={() => remove(p.id)} title="Löschen"><Trash2 size={15} /></button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {/* Datenbank */}
          <div className="mb-4">
            <div className="text-xs uppercase tracking-wider text-neutral-400 px-3 mb-1">Datenbank</div>
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded ${activeTab === "database" ? "bg-emerald-700/30" : "hover:bg-neutral-800"}`}
              onClick={() => setActiveTab("database")}
            >
              <Database size={16} /> Datenbank öffnen
            </button>
          </div>
          {/* Einstellungen */}
          <div className="mb-2">
            <div className="text-xs uppercase tracking-wider text-neutral-400 px-3 mb-1">Einstellungen</div>
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded ${activeTab === "settings" ? "bg-emerald-700/30" : "hover:bg-neutral-800"}`}
              onClick={() => setActiveTab("settings")}
            >
              <Settings size={16} /> Einstellungen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
