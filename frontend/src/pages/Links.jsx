import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { REASON_LABEL } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeftRight } from "lucide-react";

export default function Links() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = user?.role === "admin" || user?.role === "operator";
  const [form, setForm] = useState(null);

  const { data: links } = useQuery({ queryKey: ["links"], queryFn: () => api.get("/links").then((r) => r.data), refetchInterval: 10000 });
  const { data: pops } = useQuery({ queryKey: ["pops"], queryFn: () => api.get("/pops").then((r) => r.data) });
  const popById = Object.fromEntries((pops || []).map((p) => [p.id, p]));

  const openNew = () => {
    const a = pops?.[0], b = pops?.[1];
    setForm({ name: "", pop_a: a?.id || "", pop_b: b?.id || "", iface_a: a?.interfaces?.[0]?.name || "", iface_b: b?.interfaces?.[0]?.name || "", cable_type: "Fiber Optic G.652D", capacity: "10Gbps", description: "", route: [] });
  };

  const save = async () => {
    try {
      await api.post("/links", form);
      toast.success("Link created");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["links"] });
      qc.invalidateQueries({ queryKey: ["topology"] });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const remove = async (l) => {
    if (!window.confirm(`Delete ${l.name}?`)) return;
    await api.delete(`/links/${l.id}`);
    toast.success("Link deleted");
    qc.invalidateQueries({ queryKey: ["links"] });
    qc.invalidateQueries({ queryKey: ["topology"] });
  };

  const ifaces = (pid) => popById[pid]?.interfaces || [];

  return (
    <div>
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl tracking-tight">Cable Links</h1>
          <p className="text-slate-500 text-sm">{links?.length || 0} backbone links · status is engine-derived, never manual</p>
        </div>
        {canEdit && <Button data-testid="new-link-btn" onClick={openNew} className="bg-blue-600 hover:bg-blue-500 rounded-sm"><Plus className="h-4 w-4 mr-1" /> New Link</Button>}
      </div>
      <div className="p-6">
        <div className="rounded-sm border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                {["Link", "Endpoints", "Status", "Reason", "Distance", "Capacity", ""].map((h) => (
                  <TableHead key={h} className="text-[10px] uppercase tracking-widest text-slate-500">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(links || []).map((l) => (
                <TableRow key={l.id} data-testid={`link-row-${l.name}`} className="border-slate-800 hover:bg-slate-800/40 font-mono text-xs">
                  <TableCell className="font-heading font-bold text-sm">{l.name}</TableCell>
                  <TableCell className="text-slate-300">
                    <div className="flex items-center gap-2">
                      <span>{popById[l.pop_a]?.code}<span className="text-slate-600">/{l.iface_a}</span></span>
                      <ArrowLeftRight className="h-3 w-3 text-slate-600" />
                      <span>{popById[l.pop_b]?.code}<span className="text-slate-600">/{l.iface_b}</span></span>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={l.status} live /></TableCell>
                  <TableCell className="text-slate-400">{REASON_LABEL[l.status_reason] || l.status_reason}</TableCell>
                  <TableCell className="text-slate-300">{l.distance_km} km</TableCell>
                  <TableCell className="text-slate-300">{l.capacity}</TableCell>
                  <TableCell className="text-right">
                    {user?.role === "admin" && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" data-testid={`link-delete-${l.name}`} onClick={() => remove(l)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="bg-[#0b1120] border-slate-700 text-slate-100">
          <DialogHeader><DialogTitle className="font-heading">New Cable Link</DialogTitle></DialogHeader>
          {form && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <F label="Name" span><Input data-testid="link-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="auto" className="bg-slate-900 border-slate-700 font-mono" /></F>
              <F label="POP A"><Sel value={form.pop_a} onChange={(v) => setForm({ ...form, pop_a: v, iface_a: ifaces(v)[0]?.name || "" })} options={(pops || []).map((p) => [p.id, p.code])} testid="link-pop-a" /></F>
              <F label="POP B"><Sel value={form.pop_b} onChange={(v) => setForm({ ...form, pop_b: v, iface_b: ifaces(v)[0]?.name || "" })} options={(pops || []).map((p) => [p.id, p.code])} testid="link-pop-b" /></F>
              <F label="Interface A"><Sel value={form.iface_a} onChange={(v) => setForm({ ...form, iface_a: v })} options={ifaces(form.pop_a).map((i) => [i.name, i.name])} testid="link-iface-a" /></F>
              <F label="Interface B"><Sel value={form.iface_b} onChange={(v) => setForm({ ...form, iface_b: v })} options={ifaces(form.pop_b).map((i) => [i.name, i.name])} testid="link-iface-b" /></F>
              <F label="Cable Type"><Input value={form.cable_type} onChange={(e) => setForm({ ...form, cable_type: e.target.value })} className="bg-slate-900 border-slate-700" /></F>
              <F label="Capacity"><Input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="bg-slate-900 border-slate-700 font-mono" /></F>
              <div className="col-span-2 text-[11px] text-slate-500 font-mono">Route defaults to a straight line. Use Map → Draw Link to follow the road path.</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
            <Button data-testid="link-save" onClick={save} className="bg-blue-600 hover:bg-blue-500">Save Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const F = ({ label, children, span }) => (
  <div className={span ? "col-span-2" : ""}>
    <Label className="text-[10px] uppercase tracking-widest text-slate-500">{label}</Label>
    <div className="mt-1">{children}</div>
  </div>
);

const Sel = ({ value, onChange, options, testid }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger data-testid={testid} className="bg-slate-900 border-slate-700 font-mono"><SelectValue /></SelectTrigger>
    <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
      {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
    </SelectContent>
  </Select>
);
