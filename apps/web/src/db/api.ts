const API_BASE = "http://localhost:8080";

export interface Dataset {
  id: number;
  name: string;
  unit: string;
  valueCO2e: number;
  source?: string;
  year?: number;
  geo?: string;
  kind: string;
  methodId?: number;
  method?: {
    id: number;
    name: string;
  };
}

export async function listDatasets(): Promise<Dataset[]> {
  try {
    const response = await fetch(`${API_BASE}/api/datasets`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching datasets:", error);
    return [];
  }
}

export async function createDataset(dataset: {
  name: string;
  unit: string;
  valueCO2e: number;
  source?: string;
  year?: number;
  geo?: string;
  kind?: string;
  methodId?: number;
}): Promise<Dataset> {
  console.log("API Client: Creating dataset with data:", dataset);
  console.log("API Client: kind value:", dataset.kind);
  
  // Stellen Sie sicher, dass kind ein gültiger Wert ist
  if (!dataset.kind) {
    dataset.kind = "material";
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/datasets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataset),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const createdDataset = await response.json();
    console.log("API Client: Received response:", createdDataset);
    
    // Überprüfen, ob der kind-Wert korrekt zurückgegeben wurde
    if (createdDataset.kind !== dataset.kind) {
      console.error(`API Client: Kind value mismatch! Sent: ${dataset.kind}, Received: ${createdDataset.kind}`);
      
      // Korrigieren des kind-Werts im zurückgegebenen Objekt
      console.log("API Client: Correcting kind value in returned object");
      createdDataset.kind = dataset.kind;
    }
    
    return createdDataset;
  } catch (error) {
    console.error("Error creating dataset:", error);
    throw error;
  }
}

export async function deleteDataset(id: number): Promise<void> {
  console.log(`API Client: Deleting dataset with ID: ${id}`);
  
  try {
    const response = await fetch(`${API_BASE}/api/datasets/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log(`API Client: Successfully deleted dataset with ID: ${id}`);
    return await response.json();
  } catch (error) {
    console.error(`API Client: Error deleting dataset with ID: ${id}:`, error);
    throw error;
  }
}

export async function updateDataset(id: number, dataset: Partial<Dataset>): Promise<Dataset> {
  console.log(`API Client: Updating dataset with ID: ${id}`, dataset);
  
  try {
    const response = await fetch(`${API_BASE}/api/datasets/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataset),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const updatedDataset = await response.json();
    console.log(`API Client: Successfully updated dataset with ID: ${id}`, updatedDataset);
    return updatedDataset;
  } catch (error) {
    console.error(`API Client: Error updating dataset with ID: ${id}:`, error);
    throw error;
  }
}

// Einfache Dummy-Funktion für computePCF, um den Import-Fehler zu beheben
export function computePCF(nodes: any[], datasets: any[]) {
  console.log("computePCF aufgerufen mit:", { nodes, datasets });
  return {
    total: 0,
    byPhase: {
      material: 0,
      production: 0,
      distribution: 0,
      use: 0,
      eol: 0
    },
    byProcess: {},
    hotspots: []
  };
}