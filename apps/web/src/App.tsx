import { BrowserRouter } from "react-router-dom";
import { CanvasPage } from "@/app/CanvasPage";
import { DatabasePage } from "@/app/DatabasePage";
import { ResultsPage } from "@/app/ResultsPage";
import { ElementaryPage } from "@/app/ElementaryPage";
import { GeneralInfoPage } from "@/app/GeneralInfoPage";
import { SidebarProjects, SidebarTab } from "@/components/SidebarProjects";
import { useState, useEffect } from "react";
import { Routes, Route, NavLink, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useProjectsStore } from "@/state/projects";

export default function App() {
  console.log("App component rendering");
  const [activeTab, setActiveTab] = useState<SidebarTab>("projects");
  const [databaseKey, setDatabaseKey] = useState<number>(0);
  const [open, setOpen] = useState(() => {
    const stored = localStorage.getItem('sidebar_open');
    return stored === null ? true : stored === 'true';
  });

  // Aktualisiere den databaseKey, wenn der Tab wechselt
  const handleTabChange = (tab: SidebarTab) => {
    setActiveTab(tab);
    if (tab === "database") {
      // Inkrementiere den Key, um die DatabasePage neu zu rendern
      setDatabaseKey(prev => prev + 1);
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <SidebarProjects activeTab={activeTab} setActiveTab={handleTabChange} open={open} setOpen={setOpen} />
        <div className={`transition-all duration-200 ${open ? "ml-64" : "ml-12"} p-4`}>
          <header className="mb-4 flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">PCF App</h1>
            {activeTab === "projects" && (
              <nav className="flex items-center gap-3">
                <NavPill to="/allgemein" label="Allgemeine Angaben" />
                <NavPill to="/canvas" label="Canvas" />
                <NavPill to="/elementary" label="Elementarflüsse" />
                <NavPill to="/ergebnisse" label="Ergebnisse" />
              </nav>
            )}
          </header>
          {activeTab === "projects" && <RoutesContent />}
          {activeTab === "database" && <DatabasePage key={databaseKey} />}
          {activeTab === "settings" && (
            <div className="p-4 text-neutral-300 bg-neutral-900 rounded-md border border-neutral-800">Einstellungen (coming soon)</div>
          )}
        </div>
      </div>
      <Toaster />
    </BrowserRouter>
  );
}

function RoutesContent() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/allgemein" replace />} />
      <Route path="/allgemein" element={<GeneralInfoPage />} />
      <Route path="/canvas" element={<CanvasPage />} />
      <Route path="/elementary" element={<ElementaryPage />} />
      <Route path="/ergebnisse" element={<ResultsPage />} />
      <Route path="*" element={<div className="p-2">404 – Seite nicht gefunden</div>} />
    </Routes>
  );
}

function NavPill({ to, label, exact = false }: { to: string; label: string; exact?: boolean }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
          isActive
            ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
            : "bg-neutral-900/50 border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:border-neutral-600"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
