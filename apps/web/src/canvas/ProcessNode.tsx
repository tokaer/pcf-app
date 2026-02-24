import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ProcessData } from "@/types/flows";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { LIFECYCLE_STAGES, LifecycleStage } from "@/types/lifecycle";

// Map between old process stage types and new lifecycle stages
const stageToLifecycleMap: Record<ProcessData["stage"], LifecycleStage> = {
  material: "raw_material_acquisition",
  production: "production",
  distribution: "distribution",
  use: "use",
  eol: "end_of_life",
};

const lifecycleToStageMap: Record<LifecycleStage, ProcessData["stage"]> = {
  raw_material_acquisition: "material",
  production: "production",
  distribution: "distribution",
  use: "use",
  end_of_life: "eol",
};

// For backward compatibility, we'll map the old stage values to the new labels
const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  LIFECYCLE_STAGES.map(stage => [
    lifecycleToStageMap[stage.key],
    stage.label
  ])
);

// Array of process stage values for the dropdown
const PROCESS_STAGES: Array<ProcessData["stage"]> = ["material", "production", "distribution", "use", "eol"];

export default function ProcessNode({ id, data }: NodeProps<ProcessData>) {
  const [editing, setEditing] = useState(false);
  const [titleLocal, setTitleLocal] = useState(data?.title ?? "Prozess");

  const inputCount = data?.elementary?.inputs?.length ?? 0;
  const outputCount = data?.elementary?.outputs?.length ?? 0;

  const commitTitle = () => {
    if (titleLocal !== data?.title) {
      const ev = new CustomEvent("pcf:updateNodeTitle", { detail: { id, title: titleLocal } });
      window.dispatchEvent(ev);
    }
    setEditing(false);
  };

  const changeStage = (stage: ProcessData["stage"]) => {
    const ev = new CustomEvent("pcf:updateNodeStage", { detail: { id, stage } });
    window.dispatchEvent(ev);
  };

  return (
    <div className="rounded-2xl border bg-neutral-900 text-white px-3 py-2 min-w-56 relative">
      {/* Delete button */}
      <button
        onClick={() => {
          const ev = new CustomEvent("pcf:deleteNode", { detail: { id } });
          window.dispatchEvent(ev);
        }}
        className="absolute -top-2 -right-2 p-1 rounded-full bg-red-900/80 hover:bg-red-800 border border-red-700"
        title="Prozess löschen"
      >
        <Trash2 size={12} className="text-red-200" />
      </button>

      {/* Nur zwei Haupt-Handles */}
      <Handle id="main-in" type="target" position={Position.Left} />
      <Handle id="main-out" type="source" position={Position.Right} />

      <div className="text-[10px] opacity-60">Prozessmodul</div>
      {editing ? (
        <input
          autoFocus
          className="w-full bg-neutral-800 rounded px-2 py-1 text-sm"
          value={titleLocal}
          onChange={(e) => setTitleLocal(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitTitle();
            if (e.key === "Escape") {
              setTitleLocal(data?.title ?? "Prozess");
              setEditing(false);
            }
          }}
        />
      ) : (
        <div className="text-sm font-semibold" onDoubleClick={() => setEditing(true)} title="Doppelklick zum Umbenennen">
          {data?.title ?? "Prozess"}
        </div>
      )}

      <div className="mt-1">
        <select
          value={data?.stage ?? "production"}
          onChange={(e) => changeStage(e.target.value as ProcessData["stage"])}
          className="text-[10px] bg-neutral-800 rounded px-1 py-0.5 border border-neutral-700"
        >
          {PROCESS_STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_LABEL[s]}</option>
          ))}
        </select>
      </div>

      <div className="mt-1 text-[10px] opacity-70">
        Elem: Input {inputCount} · Output {outputCount}
      </div>

      <div className="mt-2">
        <button
          className="text-[10px] px-2 py-1 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
          onClick={() => {
            const ev = new CustomEvent("pcf:editElementary", { detail: { id } });
            window.dispatchEvent(ev);
          }}
        >
          Elementarflüsse bearbeiten
        </button>
      </div>
    </div>
  );
}
