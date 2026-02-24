import { create } from "zustand";
import { useProjectsStore } from "./projects";

interface DatasetSelectionState {
  // Map of processId_elementaryIndex to datasetId
  selections: Record<string, number>;
  setDatasetForElement: (processId: string, elementaryIndex: number, direction: "inputs" | "outputs", datasetId: number | undefined) => void;
  load: () => void;
  save: () => void;
}

function getStorageKey(projectId: string | null) {
  return projectId ? `pcf_datasets_${projectId}` : "pcf_datasets_default";
}

export const useDatasetSelections = create<DatasetSelectionState>((set, get) => ({
  selections: {},
  setDatasetForElement: (processId: string, elementaryIndex: number, direction: "inputs" | "outputs", datasetId: number | undefined) => {
    set((state) => {
      const key = `${processId}_${direction}_${elementaryIndex}`;
      const selections = { ...state.selections };
      const projectId = useProjectsStore.getState().selectedId;
      
      console.log('Setting dataset:', { processId, elementaryIndex, datasetId, projectId, key, direction });
      
      if (datasetId === undefined) {
        delete selections[key];
      } else {
        selections[key] = datasetId;
      }

      // Save to localStorage
      const storageKey = getStorageKey(projectId);
      console.log('Saving to localStorage:', { storageKey, selections });
      localStorage.setItem(storageKey, JSON.stringify(selections));
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event("datasets:changed"));
      
      return { selections };
    });
  },
  load: () => {
    const projectId = useProjectsStore.getState().selectedId;
    const storageKey = getStorageKey(projectId);
    console.log('Loading datasets for project:', { projectId, storageKey });
    try {
      const raw = localStorage.getItem(storageKey);
      console.log('Loaded from localStorage:', { raw });
      if (raw) {
        const selections = JSON.parse(raw);
        console.log('Parsed selections:', selections);
        set({ selections });
      } else {
        console.log('No saved selections found');
        set({ selections: {} });
      }
    } catch (error) {
      console.error('Error loading selections:', error);
      set({ selections: {} });
    }
  },
  save: () => {
    const projectId = useProjectsStore.getState().selectedId;
    const { selections } = get();
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(selections));
  }
}));
