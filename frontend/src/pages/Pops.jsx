import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { REASON_LABEL, fmtUptime, fmtBytes } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid } from "recharts";
import { MoreVertical, Trash2, Activity, Zap, ZapOff, Eye } from "lucide-react";

export default function Pops() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = user?.role === "admin" || user?.role === "operator";
  const [detail, setDetail] = useState(null);

  const { data: pops } = useQuery({ queryKey: ["pops"], queryFn: () => api.get("/pops").then((r) => r.data), refetchInterval: 10000 });

  const fault = async (pop, patch) => {
    try {
      await api.post("/monitoring/simulate-fault", { pop_id: pop.id, ...patch });
      toast.success("Fault injected — engine re-evaluated topology");
      qc.invalidateQueries({ queryKey: ["pops"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Action failed");
    }
  };

  const remove = async (pop) => {
    if (!window.confirm(`Delete ${pop.name}? This removes its links too.`)) return;
    await api.delete(`/pops/${pop.id}`);
    toast.success("POP deleted");
    qc.invalidateQueries({ queryKey: ["pops"] });
  };

  return (
    <div>
      <div className="px-6 py-5 border-b border-slate-800">
        <h1 className="font-heading font-black text-3xl tracking-tight">POP Management</h1>
        <p className="text-slate-500 text-sm">{pops?.length || 0} points of presence · inject demo faults to see the engine react</p>
      </div>
      <div className="p-6">
        <div className="rounded-sm border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                {["POP", "Status", "Reason", "IP", "Latency", "CPU", "RAM", "Uptime", "Links", ""].map((h) => (
                  <TableHead key={h} className="text-[10px] uppercase tracking-widest text-slate-500">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(pops || []).map((p) => (
                <TableRow key={p.id} data-testid={`pop-row-${p.code}`} className="border-slate-800 hover:bg-slate-800/40 font-mono text-xs">
                  <TableCell>
                    <div className="font-heading font-bold text-sm not-italic">{p.name} {p.is_core && <span className="text-[9px] text-blue-400 border border-blue-500/40 rounded px-1 ml-1">CORE</span>}</div>
                    <div className="text-slate-500">{p.code}</div>
                  </TableCell>
                  <TableCell><StatusBadge status={p.status} live /></TableCell>
                  <TableCell className="text-slate-400">{REASON_LABEL[p.status_reason] || p.status_reason}</TableCell>
                  <TableCell className="text-slate-300">{p.mikrotik_ip || "—"}</TableCell>
                  <TableCell className="text-slate-300">{p.latency ?? "—"} ms</TableCell>
                  <TableCell className={p.cpu > 80 ? "text-red-400" : "text-slate-300"}>{p.cpu}%</TableCell>
                  <TableCell className={p.ram_pct > 80 ? "text-red-400" : "text-slate-300"}>{p.ram_pct}%</TableCell>
                  <TableCell className="text-slate-300">{fmtUptime(p.uptime_seconds)}</TableCell>
                  <TableCell className="text-slate-300">{p.link_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-7 w-7" data-testid={`pop-detail-${p.code}`} onClick={() => setDetail(p)}><Eye className="h-3.5 w-3.5" /></Button>
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7" data-testid={`pop-actions-${p.code}`}><MoreVertical className="h-3.5 w-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-900 border-slate-700 text-slate-200">
                            <DropdownMenuLabel className="text-[10px] uppercase text-slate-500">Fault Simulation</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => fault(p, { router_down: !(p.status === "DOWN" && p.status_reason === "ROUTER_DOWN") })}>
                              <ZapOff className="h-3.5 w-3.5 mr-2" /> Toggle Router Down
                            </DropdownMenuItem>
                            {(p.interfaces || []).map((i) => (
                              <DropdownMenuItem key={i.name} onClick={() => {
                                const down = new Set((p.interfaces || []).filter((x) => x.status === "down").map((x) => x.name));
                                down.has(i.name) ? down.delete(i.name) : down.add(i.name);
                                fault(p, { interfaces_down: Array.from(down) });
                              }}>
                                <Zap className="h-3.5 w-3.5 mr-2" /> Toggle {i.name} {i.status === "down" ? "(down)" : ""}
                              </DropdownMenuItem>
                            ))}
                            {user?.role === "admin" && (<>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              <DropdownMenuItem onClick={() => remove(p)} className="text-red-400"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete POP</DropdownMenuItem>
                            </>)}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <PopDetail pop={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function PopDetail({ pop, onClose }) {
  const { data: metrics } = useQuery({
    queryKey: ["pop-metrics", pop?.id],
    queryFn: () => api.get(`/pops/${pop.id}/metrics`, { params: { limit: 40 } }).then((r) => r.data),
    enabled: !!pop,
    refetchInterval: 10000,
  });
  if (!pop) return null;
  const chart = (metrics || []).map((m, i) => ({ i, cpu: m.cpu, ram: m.ram_pct, latency: m.latency }));

  return (
    <Dialog open={!!pop} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0b1120] border-slate-700 text-slate-100 max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">{pop.name} <StatusBadge status={pop.status} /></DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          {[["Model", pop.model], ["RouterOS", pop.routeros_version], ["Identity", pop.router_identity], ["Serial", pop.serial],
            ["IP", pop.mikrotik_ip], ["Gateway", pop.gateway_ip], ["Access", pop.access_method], ["Uptime", fmtUptime(pop.uptime_seconds)]].map(([k, v]) => (
            <div key={k} className="border border-slate-800 rounded-sm p-2">
              <div className="text-[9px] text-slate-500 uppercase">{k}</div>
              <div className="text-slate-200 truncate">{v || "—"}</div>
            </div>
          ))}
        </div>

        <div className="h-44 mt-2">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1"><Activity className="h-3 w-3" /> CPU / RAM / Latency history</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis dataKey="i" hide />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} width={28} />
              <RTooltip contentStyle={{ background: "#0b1120", border: "1px solid #334155", fontSize: 11 }} />
              <Line type="monotone" dataKey="cpu" stroke="#3b82f6" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="ram" stroke="#f59e0b" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="latency" stroke="#10b981" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Interfaces</div>
          <div className="rounded-sm border border-slate-800 overflow-hidden max-h-48 overflow-y-auto">
            <table className="w-full text-[11px] font-mono">
              <thead className="text-slate-500 bg-slate-900/50">
                <tr>{["Name", "Status", "RX", "TX", "Errors", "Speed"].map((h) => <th key={h} className="text-left px-2 py-1 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {(pop.interfaces || []).map((i) => (
                  <tr key={i.name} className="border-t border-slate-800">
                    <td className="px-2 py-1">{i.name}</td>
                    <td className={`px-2 py-1 ${i.status === "up" ? "text-emerald-400" : i.status === "down" ? "text-red-400" : "text-slate-500"}`}>{i.status}</td>
                    <td className="px-2 py-1">{fmtBytes(i.rx_bytes)}</td>
                    <td className="px-2 py-1">{fmtBytes(i.tx_bytes)}</td>
                    <td className="px-2 py-1">{(i.rx_errors || 0) + (i.tx_errors || 0)}</td>
                    <td className="px-2 py-1">{i.speed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
