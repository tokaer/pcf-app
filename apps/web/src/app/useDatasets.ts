import { useEffect, useState, useCallback } from "react";
import { listDatasets } from "@/db/api";

export function useDatasets() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  const reload = useCallback(() => {
    console.log("useDatasets: Reloading datasets...");
    setLoading(true);
    listDatasets()
      .then((rows) => {
        console.log("useDatasets: Received datasets:", rows);
        setList(Array.isArray(rows) ? rows : []);
        setError(null);
      })
      .catch((e) => {
        console.error("useDatasets: Error loading datasets:", e);
        setError(e);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener("datasets:changed", handler);
    return () => window.removeEventListener("datasets:changed", handler);
  }, [reload]);

  return { list, loading, error, reload } as const;
}
