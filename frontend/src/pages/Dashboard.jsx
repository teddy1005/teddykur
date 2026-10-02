import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { getStatus, REASON_LABEL, fmtUptime } from "@/lib/status";
import { cn } from "@/lib/utils";
import {
  Server, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Cable, Gauge, Cpu, MemoryStick, Timer,
} from "lucide-react";

const fetchDashboard = () => api.get("/dashboard").then((r) => r.data);

function KPI({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className="border-r border-b border-slate-800 p-5 bg-[#0b1120]">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">{label}</span>
        {Icon && <Icon className={cn("h-4 w-4", accent || "text-slate-600")} />}
      </div>
      <div className={cn("font-heading font-black text-3xl mt-2", accent || "text-slate-100")}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1 font-mono">{sub}</div>}
    </div>
  );
}

function PopCard({ p }) {
  const s = getStatus(p.status);
  return (
    <div
      data-testid={`pop-card-${p.code}`}
      className={cn(
        "rounded-sm border bg-[#0b1120] p-4 transition-transform duration-150 hover:-translate-y-[1px] hover:border-slate-600",
        s.border
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-heading font-bold text-sm">{p.name}</div>
          <div className="text-[11px] text-slate-500 font-mono">{p.mikrotik_ip || p.code}</div>
        </div>
        <StatusBadge status={p.status} live />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
        <Metric label="LATENCY" value={p.latency != null ? `${p.latency} ms` : "—"} />
        <Metric label="LOSS" value={`${p.packet_loss ?? 0}%`} />
        <Metric label="CPU" value={`${p.cpu ?? 0}%`} bar={p.cpu} />
        <Metric label="RAM" value={`${p.ram_pct ?? 0}%`} bar={p.ram_pct} />
        <Metric label="UPTIME" value={fmtUptime(p.uptime_seconds)} />
        <Metric label="LINKS" value={p.link_count ?? 0} />
      </div>
      <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
        <span>{REASON_LABEL[p.status_reason] || p.status_reason}</span>
        <span>{p.last_check ? new Date(p.last_check).toLocaleTimeString() : "—"}</span>
      </div>
    </div>
  );
}

function Metric({ label, value, bar }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-slate-200">{value}</div>
      {bar != null && (
        <div className="h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
          <div
            className={cn("h-full rounded-full", bar > 80 ? "bg-red-500" : bar > 60 ? "bg-amber-500" : "bg-emerald-500")}
            style={{ width: `${Math.min(100, bar)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard, refetchInterval: 10000 });
  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.get("/alerts", { params: { limit: 12 } }).then((r) => r.data),
    refetchInterval: 10000,
  });

  if (!data) return <div className="p-6 text-slate-500 font-mono text-sm">Loading dashboard…</div>;
  const s = data.summary;

  return (
    <div>
      <div className="px-6 py-5 border-b border-slate-800">
        <h1 className="font-heading font-black text-3xl tracking-tight">Dashboard</h1>
        <p className="text-slate-500 text-sm">Network-wide operational overview</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 border-t border-l border-slate-800">
        <KPI label="Total POP" value={s.total_pop} icon={Server} />
        <KPI label="POP Up" value={s.pop_up} accent="text-emerald-400" icon={ArrowUpCircle} />
        <KPI label="POP Down" value={s.pop_down} accent="text-red-400" icon={ArrowDownCircle} />
        <KPI label="Degraded" value={s.pop_degraded} accent="text-amber-400" icon={AlertTriangle} />
        <KPI label="Avg Latency" value={`${s.avg_latency}`} sub="milliseconds" accent="text-sky-400" icon={Timer} />
        <KPI label="Links" value={s.total_link} sub={`${s.link_up} up · ${s.link_down} down · ${s.link_degraded} deg`} icon={Cable} />
      </div>

      <div className="grid xl:grid-cols-3 gap-6 p-6">
        {/* POP cards */}
        <div className="xl:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Server className="h-4 w-4 text-slate-400" />
            <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-slate-400">POP Status</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4" data-testid="pop-cards">
            {data.pops.map((p) => (
              <PopCard key={p.id} p={p} />
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Panel title="Event Feed" icon={AlertTriangle}>
            <div className="space-y-2 max-h-72 overflow-y-auto" data-testid="event-feed">
              {(alerts || []).map((a) => (
                <div key={a.id} className="text-xs border-l-2 pl-2 py-1 border-slate-700">
                  <div className="font-mono text-slate-500 text-[10px]">
                    {new Date(a.created_at).toLocaleTimeString()}
                  </div>
                  <div className={cn(
                    a.severity === "critical" ? "text-red-400" : a.severity === "warning" ? "text-amber-400" : "text-sky-400"
                  )}>
                    {a.message}
                  </div>
                </div>
              ))}
              {(!alerts || alerts.length === 0) && <div className="text-xs text-slate-600">No events yet.</div>}
            </div>
          </Panel>

          <Panel title="Highest Latency" icon={Gauge}>
            <MiniList items={data.highest_latency} render={(p) => `${p.latency ?? "—"} ms`} />
          </Panel>

          <div className="grid grid-cols-2 gap-6">
            <Panel title="High CPU" icon={Cpu}>
              <MiniList items={data.high_cpu} render={(p) => `${p.cpu}%`} />
            </Panel>
            <Panel title="High RAM" icon={MemoryStick}>
              <MiniList items={data.high_ram} render={(p) => `${p.ram_pct}%`} />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="rounded-sm border border-slate-800 bg-[#0b1120]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
        <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-slate-400">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function MiniList({ items, render }) {
  if (!items || items.length === 0) return <div className="text-xs text-slate-600">No data.</div>;
  return (
    <div className="space-y-1.5">
      {items.map((p) => (
        <div key={p.id} className="flex items-center justify-between text-xs">
          <span className="truncate text-slate-300">{p.name}</span>
          <span className="font-mono text-slate-200">{render(p)}</span>
        </div>
      ))}
    </div>
  );
}
