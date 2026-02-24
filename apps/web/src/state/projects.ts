import { create } from "zustand";

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsState {
  projects: ProjectMeta[];
  selectedId: string | null;
  create: (name?: string) => void;
  select: (id: string) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  load: () => void;
}

const LS_KEY = "pcf_projects_v1";
const LS_SELECTED = "pcf_selected_project_v1";

function saveToLS(projects: ProjectMeta[], selectedId: string | null) {
  localStorage.setItem(LS_KEY, JSON.stringify(projects));
  if (selectedId) localStorage.setItem(LS_SELECTED, selectedId);
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  selectedId: null,
  create: (name = "Neue Bilanz") => {
    const id = "p" + Date.now();
    const now = new Date().toISOString();
    const proj = { id, name, createdAt: now, updatedAt: now };
    const projects = [proj, ...get().projects];
    console.log("Creating new project with ID:", id);
    set({ projects, selectedId: id });
    saveToLS(projects, id);
  },
  select: (id) => {
    console.log("Selecting project with ID:", id);
    set({ selectedId: id });
    localStorage.setItem(LS_SELECTED, id);
  },
  remove: (id) => {
    const projects = get().projects.filter((p) => p.id !== id);
    let selectedId = get().selectedId;
    if (selectedId === id) selectedId = projects[0]?.id || null;
    set({ projects, selectedId });
    saveToLS(projects, selectedId);
  },
  rename: (id, name) => {
    const projects = get().projects.map((p) =>
      p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
    );
    set({ projects });
    saveToLS(projects, get().selectedId);
  },
  load: () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const sel = localStorage.getItem(LS_SELECTED);
      if (raw) set({ projects: JSON.parse(raw) });
      if (sel) set({ selectedId: sel });
    } catch {}
  },
}));
