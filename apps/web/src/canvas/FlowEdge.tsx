import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { FlowData } from "@/types/flows";

export default function FlowEdge(props: EdgeProps<FlowData>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });

  // Show default text if no specific data is set
  const isDefault = !data?.name && data?.amount === 1 && data?.unit === "kg";
  const label = isDefault ? "(Hauptstoffstrom)" : `${data.amount} ${data.unit} ${data.name}`.trim();

  return (
    <>
      <BaseEdge id={id} path={path} />
      <EdgeLabelRenderer>
        <div 
          style={{ position: "absolute", transform: `translate(-50%,-50%) translate(${labelX}px, ${labelY}px)` }}
          className="cursor-pointer"
        >
          <span className={`text-[10px] bg-neutral-800 text-white px-1.5 py-0.5 rounded border border-neutral-700 hover:bg-neutral-700 ${isDefault ? 'italic opacity-75' : ''}`}>
            {label}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
