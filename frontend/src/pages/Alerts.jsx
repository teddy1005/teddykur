import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SEVERITY, REASON_LABEL } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, AlertOctagon, Check, CheckCheck } from "lucide-react";

const ICON = { critical: AlertOctagon, warning: AlertTriangle, info: Info };

export default function Alerts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = user?.role === "admin" || user?.role === "operator";
  const [filter, setFilter] = useState("all");

  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.get("/alerts", { params: { limit: 200 } }).then((r) => r.data),
    refetchInterval: 8000,
  });

  const resolve = async (a) => {
    await api.post(`/alerts/${a.id}/resolve`);
    toast.success("Alert resolved");
    qc.invalidateQueries({ queryKey: ["alerts"] });
  };

  const list = (alerts || []).filter((a) => (filter === "all" ? true : filter === "unresolved" ? !a.resolved_at : a.severity === filter));

  return (
    <div>
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-black text-3xl tracking-tight">Alerts &amp; Events</h1>
          <p className="text-slate-500 text-sm">Status transitions and topology events</p>
        </div>
        <div className="flex gap-1">
          {["all", "unresolved", "critical", "warning", "info"].map((f) => (
            <button key={f} data-testid={`alert-filter-${f}`} onClick={() => setFilter(f)}
              className={cn("px-3 py-1 rounded-sm text-xs border capitalize transition-colors duration-150",
                filter === f ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-4xl">
        <div className="relative border-l border-slate-800 ml-2" data-testid="alerts-timeline">
          {list.map((a) => {
            const sev = SEVERITY[a.severity] || SEVERITY.info;
            const Icon = ICON[a.severity] || Info;
            return (
              <div key={a.id} className="relative pl-6 pb-5">
                <span className={cn("absolute -left-[9px] top-0.5 h-4 w-4 rounded-full border-2 border-[#020617] flex items-center justify-center", sev.bg)}>
                  <span className={cn("h-2 w-2 rounded-full", a.severity === "critical" ? "bg-red-500" : a.severity === "warning" ? "bg-amber-500" : "bg-sky-500")} />
                </span>
                <div className={cn("rounded-sm border p-3", sev.border, sev.bg)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-3.5 w-3.5", sev.text)} />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{a.type}</span>
                        <span className="font-mono text-[10px] text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
                        {a.resolved_at && <span className="text-[10px] text-emerald-400 flex items-center gap-0.5"><CheckCheck className="h-3 w-3" /> resolved</span>}
                      </div>
                      <div className={cn("text-sm mt-1", sev.text)}>{a.message}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{REASON_LABEL[a.reason] || a.reason} · {a.object_name}</div>
                    </div>
                    {canEdit && !a.resolved_at && (
                      <Button size="sm" variant="ghost" data-testid={`resolve-${a.id}`} onClick={() => resolve(a)} className="h-7 text-xs shrink-0"><Check className="h-3.5 w-3.5 mr-1" /> Resolve</Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {list.length === 0 && <div className="pl-6 text-sm text-slate-600">No events match this filter.</div>}
        </div>
      </div>
    </div>
  );
}
