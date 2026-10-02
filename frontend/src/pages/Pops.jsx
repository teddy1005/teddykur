import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { REASON_LABEL, fmtUptime, fmtBytes } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid } from "recharts";
import { MoreVertical, Trash2, Activity, Zap, ZapOff, Eye, Pencil, Wifi, Loader2, Plus } from "lucide-react";

export default function Pops() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = user?.role === "admin" || user?.role === "operator";
  const [detail, setDetail] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const { data: pops } = useQuery({ queryKey: ["pops"], queryFn: () => api.get("/pops").then((r) => r.data), refetchInterval: 10000 });

  const openEdit = (p) => {
    setTestResult(null);
    setEditForm({
      id: p.id, isNew: false, name: p.name, code: p.code,
      latitude: p.latitude ?? "", longitude: p.longitude ?? "",
      mikrotik_ip: p.mikrotik_ip || "", gateway_ip: p.gateway_ip || "",
      access_method: p.access_method || "rest", api_port: p.api_port || 443, username: p.username || "",
      password: "", snmp_community: "", simulation_enabled: p.simulation?.enabled ?? true,
      is_core: p.is_core || false, interfaces: (p.interfaces || []).map((i) => i.name).join(","),
    });
  };

  const openCreate = () => {
    setTestResult(null);
    setEditForm({
      isNew: true, name: "", code: "", latitude: "", longitude: "", address: "",
      mikrotik_ip: "", gateway_ip: "", access_method: "api", api_port: 8728, username: "",
      password: "", snmp_community: "", simulation_enabled: true, is_core: false, interfaces: "ether1,ether2",
    });
  };

  const buildBody = (f) => {
    const b = {
      name: f.name, code: f.code, address: f.address || "", mikrotik_ip: f.mikrotik_ip,
      gateway_ip: f.gateway_ip, access_method: f.access_method, api_port: Number(f.api_port),
      username: f.username, password: f.password, snmp_community: f.snmp_community,
      is_core: f.is_core, simulation_enabled: f.simulation_enabled,
      interfaces: f.interfaces.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const la = parseFloat(f.latitude), lo = parseFloat(f.longitude);
    if (!isNaN(la)) b.latitude = la;
    if (!isNaN(lo)) b.longitude = lo;
    return b;
  };

  const saveEdit = async () => {
    const body = buildBody(editForm);
    if (editForm.isNew) {
      if (body.latitude == null || body.longitude == null) {
        toast.error("Latitude & longitude are required");
        return;
      }
      try {
        await api.post("/pops", body);
        toast.success("POP created");
        setEditForm(null);
        qc.invalidateQueries({ queryKey: ["pops"] });
        qc.invalidateQueries({ queryKey: ["topology"] });
      } catch (e) {
        toast.error(e.response?.data?.detail || "Failed");
      }
      return;
    }
    try {
      await api.put(`/pops/${editForm.id}`, body);
      toast.success("POP updated");
      setEditForm(null);
      qc.invalidateQueries({ queryKey: ["pops"] });
      qc.invalidateQueries({ queryKey: ["topology"] });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const testConn = async () => {
    setTesting(true); setTestResult(null);
    try {
      await api.put(`/pops/${editForm.id}`, buildBody(editForm));
      const { data } = await api.post(`/pops/${editForm.id}/test-connection`);
      setTestResult(data);
    } catch (e) {
      setTestResult({ ok: false, message: e.response?.data?.detail || "Request failed" });
    }
    setTesting(false);
  };

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
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight">POP Management</h1>
          <p className="text-slate-500 text-sm">{pops?.length || 0} points of presence · inject demo faults to see the engine react</p>
        </div>
        {canEdit && <Button data-testid="add-pop-btn" onClick={openCreate} className="bg-blue-600 hover:bg-blue-500 rounded-sm"><Plus className="h-4 w-4 mr-1" /> Add POP</Button>}
      </div>
      <div className="p-6">
        <div className="rounded-sm border border-slate-800 overflow-x-auto">
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
                            <DropdownMenuItem onClick={() => openEdit(p)} data-testid={`pop-edit-${p.code}`}><Pencil className="h-3.5 w-3.5 mr-2" /> Edit / MikroTik</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
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

      <Dialog open={!!editForm} onOpenChange={(o) => !o && setEditForm(null)}>
        <DialogContent className="bg-[#0b1120] border-slate-700 text-slate-100 max-w-2xl">
          <DialogHeader><DialogTitle className="font-heading flex items-center gap-2"><Wifi className="h-4 w-4" /> {editForm?.isNew ? "New POP" : `${editForm?.name} — Configuration`}</DialogTitle></DialogHeader>
          {editForm && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <EF label="Name"><Input data-testid="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-slate-900 border-slate-700" /></EF>
                <EF label="Code"><Input value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} className="bg-slate-900 border-slate-700" /></EF>
                <EF label="Latitude"><Input data-testid="edit-lat" value={editForm.latitude} onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })} placeholder="-6.2088" className="bg-slate-900 border-slate-700 font-mono" /></EF>
                <EF label="Longitude"><Input data-testid="edit-lng" value={editForm.longitude} onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })} placeholder="106.8456" className="bg-slate-900 border-slate-700 font-mono" /></EF>
                <EF label="MikroTik IP"><Input data-testid="edit-ip" value={editForm.mikrotik_ip} onChange={(e) => setEditForm({ ...editForm, mikrotik_ip: e.target.value })} placeholder="public IP" className="bg-slate-900 border-slate-700 font-mono" /></EF>
                <EF label="Gateway IP"><Input value={editForm.gateway_ip} onChange={(e) => setEditForm({ ...editForm, gateway_ip: e.target.value })} className="bg-slate-900 border-slate-700 font-mono" /></EF>
                <EF label="Access Method">
                  <Select value={editForm.access_method} onValueChange={(v) => setEditForm({ ...editForm, access_method: v, api_port: v === "snmp" ? 161 : v === "api" ? 8728 : 443 })}>
                    <SelectTrigger data-testid="edit-method" className="bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                      <SelectItem value="api">RouterOS API (v6 &amp; v7, no SSL)</SelectItem>
                      <SelectItem value="rest">RouterOS REST API (v7+)</SelectItem>
                      <SelectItem value="snmp">SNMP</SelectItem>
                    </SelectContent>
                  </Select>
                </EF>
                <EF label="Port"><Input value={editForm.api_port} onChange={(e) => setEditForm({ ...editForm, api_port: e.target.value })} className="bg-slate-900 border-slate-700 font-mono" /></EF>
                {editForm.access_method !== "snmp" ? (<>
                  <EF label="Username"><Input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} className="bg-slate-900 border-slate-700 font-mono" /></EF>
                  <EF label="Password"><Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="leave blank to keep" className="bg-slate-900 border-slate-700 font-mono" /></EF>
                </>) : (
                  <EF label="SNMP Community" span><Input type="password" value={editForm.snmp_community} onChange={(e) => setEditForm({ ...editForm, snmp_community: e.target.value })} placeholder="leave blank to keep" className="bg-slate-900 border-slate-700 font-mono" /></EF>
                )}
                <EF label="Interfaces (comma)" span><Input value={editForm.interfaces} onChange={(e) => setEditForm({ ...editForm, interfaces: e.target.value })} className="bg-slate-900 border-slate-700 font-mono" /></EF>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs text-slate-300"><Switch data-testid="edit-sim" checked={editForm.simulation_enabled} onCheckedChange={(v) => setEditForm({ ...editForm, simulation_enabled: v })} /> Simulation mode {editForm.simulation_enabled ? "(demo data)" : "(LIVE device polling)"}</label>
                <label className="flex items-center gap-2 text-xs text-slate-300"><Switch checked={editForm.is_core} onCheckedChange={(v) => setEditForm({ ...editForm, is_core: v })} /> Core POP</label>
              </div>
              {!editForm.simulation_enabled && (
                <div className="text-[11px] text-amber-400/90 font-mono border border-amber-500/30 bg-amber-500/10 rounded-sm px-3 py-2">
                  LIVE mode: device must be public-facing &amp; reachable from the cloud. Use "Save &amp; Test Connection" to verify.
                </div>
              )}
              {testResult && (
                <div data-testid="test-result" className={`rounded-sm border p-3 text-xs font-mono space-y-0.5 ${testResult.ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-red-500/40 bg-red-500/10 text-red-300"}`}>
                  <div className="font-bold">{testResult.ok ? "✓ CONNECTED" : "✗ FAILED"}</div>
                  {testResult.identity && <div>Identity: {testResult.identity}</div>}
                  {testResult.version && <div>RouterOS {testResult.version} · {testResult.board}</div>}
                  {testResult.latency != null && <div>ICMP latency: {testResult.latency} ms</div>}
                  {testResult.cpu != null && <div>CPU: {testResult.cpu}%</div>}
                  {testResult.message && <div>{testResult.message}</div>}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditForm(null)}>Cancel</Button>
            {!editForm?.isNew && (
              <Button variant="outline" data-testid="test-connection-btn" onClick={testConn} disabled={testing} className="border-slate-600 bg-transparent hover:bg-slate-800">
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Test Connection"}
              </Button>
            )}
            <Button data-testid="pop-edit-save" onClick={saveEdit} className="bg-blue-600 hover:bg-blue-500">{editForm?.isNew ? "Create POP" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EF({ label, children, span }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <Label className="text-[10px] uppercase tracking-widest text-slate-500">{label}</Label>
      <div className="mt-1">{children}</div>
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
