export const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8080";

export async function getDatasets(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${API_URL}/api/datasets${qs}`);
  if (!res.ok) throw new Error("Failed to load datasets");
  return res.json();
}
