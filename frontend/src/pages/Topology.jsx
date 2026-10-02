import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import api from "@/lib/api";
import { getStatus, REASON_LABEL } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";
import { Server } from "lucide-react";

function PopNode({ data }) {
  const s = getStatus(data.status);
  return (
    <div
      data-testid={`topo-node-${data.code}`}
      className={`rounded-sm border-2 bg-[#0b1120] px-3 py-2 w-[180px] ${s.border}`}
      style={{ boxShadow: data.status === "DOWN" ? "inset 0 0 20px rgba(239,68,68,0.25)" : "none" }}
    >
      <Handle type="source" position={Position.Right} className="!bg-slate-500" />
      <Handle type="target" position={Position.Left} className="!bg-slate-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500" id="b" />
      <Handle type="target" position={Position.Top} className="!bg-slate-500" id="t" />
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Server className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-heading font-bold text-xs">{data.code}</span>
        </div>
        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      </div>
      <div className="text-[10px] text-slate-500 font-mono truncate mb-1">{data.name}</div>
      <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-300">
        <div><span className="text-slate-600">CPU</span> {data.cpu}%</div>
        <div><span className="text-slate-600">RAM</span> {data.ram_pct}%</div>
        <div><span className="text-slate-600">ms</span> {data.latency ?? "—"}</div>
      </div>
    </div>
  );
}

const nodeTypes = { pop: PopNode };

export default function Topology() {
  const { data } = useQuery({
    queryKey: ["topology"],
    queryFn: () => api.get("/topology").then((r) => r.data),
    refetchInterval: 10000,
  });

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    const lats = data.pops.map((p) => p.latitude);
    const lngs = data.pops.map((p) => p.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const W = 820, H = 460;
    const nx = (lng) => (maxLng === minLng ? W / 2 : ((lng - minLng) / (maxLng - minLng)) * W);
    const ny = (lat) => (maxLat === minLat ? H / 2 : ((maxLat - lat) / (maxLat - minLat)) * H);

    const nodes = data.pops.map((p) => ({
      id: p.id,
      type: "pop",
      position: { x: nx(p.longitude), y: ny(p.latitude) },
      data: { code: p.code, name: p.name, status: p.status, cpu: p.cpu, ram_pct: p.ram_pct, latency: p.latency },
    }));

    const edges = data.links.map((l) => {
      const st = getStatus(l.status);
      return {
        id: l.id,
        source: l.pop_a,
        target: l.pop_b,
        animated: l.status === "UP",
        label: `${l.status} · ${REASON_LABEL[l.status_reason] || ""}`,
        style: { stroke: st.hex, strokeWidth: 2, strokeDasharray: l.status === "DOWN" ? "4 4" : undefined },
        labelStyle: { fill: st.hex, fontSize: 9 },
        labelBgStyle: { fill: "#020617" },
        markerEnd: { type: MarkerType.ArrowClosed, color: st.hex },
      };
    });
    return { nodes, edges };
  }, [data]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl tracking-tight">Network Topology</h1>
          <p className="text-slate-500 text-sm">Graph-derived POP &amp; backbone link status</p>
        </div>
        <div className="flex gap-2">
          {["UP", "DEGRADED", "DOWN", "UNKNOWN"].map((st) => (
            <StatusBadge key={st} status={st} />
          ))}
        </div>
      </div>
      <div className="flex-1" data-testid="topology-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: false }}
          minZoom={0.3}
        >
          <Background color="#1e293b" gap={24} />
          <Controls className="!bg-slate-900 !border-slate-700" />
        </ReactFlow>
      </div>
    </div>
  );
}
