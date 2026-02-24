import React, { useEffect } from "react";
import { useProject } from "@/state/project";
import { useProjectsStore } from "@/state/projects";

export function ReportPage() {
  const report = useProject((s) => s.report);
  const setReport = useProject((s) => s.setReport);
  const load = useProject((s) => s.load);
  const save = useProject((s) => s.save);
  const selectedProjectId = useProjectsStore((s) => s.selectedId);

  useEffect(() => { load(); }, [selectedProjectId, load]);
  useEffect(() => { save(); }, [report, save]);

  return (
    <div className="rounded-md border bg-white p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Ziel / Scope</label>
          <input className="w-full rounded-md border px-2 py-1" value={report.goal} onChange={(e) => setReport({ goal: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Funktionale Einheit</label>
          <input className="w-full rounded-md border px-2 py-1" value={report.fu} onChange={(e) => setReport({ fu: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Systemgrenzen</label>
          <textarea className="w-full rounded-md border px-2 py-1 h-24" value={report.boundaries} onChange={(e) => setReport({ boundaries: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Methode / GWP-Set</label>
          <input className="w-full rounded-md border px-2 py-1" value={report.method} onChange={(e) => setReport({ method: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Annahmen</label>
          <input className="w-full rounded-md border px-2 py-1" value={report.assumptions} onChange={(e) => setReport({ assumptions: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
