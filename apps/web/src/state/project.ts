import { create } from "zustand";
import { useProjectsStore } from "@/state/projects";

export interface ReportState {
  goal: string;
  fu: string;
  boundaries: string;
  method: string;
  assumptions: string;
}

interface ProjectState {
  apiUrl: string;
  report: ReportState;
  setReport: (p: Partial<ReportState>) => void;
  save: () => void;
  load: () => void;
}

const EMPTY: ReportState = { goal: "", fu: "", boundaries: "", method: "", assumptions: "" };
function getStorageKey(projectId: string | null) {
  return projectId ? `pcf_report_${projectId}` : "pcf_report_default";
}

export const useProject = create<ProjectState>((set, get) => ({
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  report: EMPTY,
  setReport: (p) => {
    set((s) => {
      const next = { ...s.report, ...p };
      const projectId = useProjectsStore.getState().selectedId;
      localStorage.setItem(getStorageKey(projectId), JSON.stringify(next));
      return { report: next };
    });
  },
  save: () => {
    const { report } = get();
    const projectId = useProjectsStore.getState().selectedId;
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(report));
  },
  load: () => {
    const projectId = useProjectsStore.getState().selectedId;
    const raw = localStorage.getItem(getStorageKey(projectId));
    if (!raw) {
      set({ report: EMPTY });
      return;
    }
    set({ report: JSON.parse(raw) });
  },
}));
