import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Save, Timer, Repeat, Gauge } from "lucide-react";

const FIELDS = [
  ["polling_interval", "Polling Interval", "seconds", Repeat],
  ["timeout", "Timeout", "seconds", Timer],
  ["retry", "Retry Count", "attempts", Repeat],
  ["latency_normal_max", "Latency Normal Max", "ms", Gauge],
  ["latency_warning_max", "Latency Warning Max", "ms", Gauge],
  ["packet_loss_warning", "Packet Loss Warning", "%", Gauge],
  ["packet_loss_critical", "Packet Loss Critical", "%", Gauge],
  ["cpu_high", "CPU High Threshold", "%", Gauge],
  ["ram_high", "RAM High Threshold", "%", Gauge],
];

export default function Monitoring() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";
  const canRun = isAdmin || user?.role === "operator";
  const [form, setForm] = useState(null);

  const { data } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then((r) => r.data) });
  useEffect(() => { if (data && !form) setForm(data); }, [data]); // eslint-disable-line

  const save = async () => {
    try {
      await api.put("/settings", form);
      toast.success("Monitoring settings saved");
      qc.invalidateQueries({ queryKey: ["settings"] });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const runCheck = async () => {
    try {
      await api.post("/monitoring/check");
      toast.success("Monitoring cycle executed");
      ["dashboard", "pops", "links", "topology", "alerts"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  if (!form) return <div className="p-6 text-slate-500 font-mono text-sm">Loading…</div>;

  return (
    <div>
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-black text-3xl tracking-tight">Monitoring Engine</h1>
          <p className="text-slate-500 text-sm">Polling cadence, timeouts and alert thresholds</p>
        </div>
        {canRun && <Button data-testid="run-check-btn" onClick={runCheck} className="bg-emerald-600 hover:bg-emerald-500 rounded-sm"><Play className="h-4 w-4 mr-1" /> Run Check Now</Button>}
      </div>

      <div className="p-6 max-w-3xl space-y-6">
        <div className="rounded-sm border border-slate-800 bg-[#0b1120]">
          <div className="px-4 py-2.5 border-b border-slate-800 text-xs uppercase tracking-widest font-bold text-slate-400">Engine Parameters</div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {FIELDS.map(([key, label, unit, Icon]) => (
              <div key={key}>
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1"><Icon className="h-3 w-3" /> {label}</Label>
                <div className="relative mt-1">
                  <Input
                    data-testid={`setting-${key}`}
                    type="number"
                    disabled={!isAdmin}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                    className="bg-slate-900 border-slate-700 font-mono pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">{unit}</span>
                </div>
              </div>
            ))}
          </div>
          {isAdmin && (
            <div className="px-4 py-3 border-t border-slate-800 flex justify-end">
              <Button data-testid="save-settings-btn" onClick={save} className="bg-blue-600 hover:bg-blue-500 rounded-sm"><Save className="h-4 w-4 mr-1" /> Save Settings</Button>
            </div>
          )}
        </div>

        <div className="rounded-sm border border-slate-800 bg-[#0b1120] p-4 text-xs text-slate-400 font-mono space-y-1">
          <div className="text-slate-300 font-bold mb-1">Threshold logic (configurable)</div>
          <div>· latency ≤ {form.latency_normal_max} ms → NORMAL</div>
          <div>· {form.latency_normal_max + 1}–{form.latency_warning_max} ms → WARNING</div>
          <div>· &gt; {form.latency_warning_max} ms → CRITICAL (DEGRADED)</div>
          <div>· packet loss ≥ {form.packet_loss_critical}% → DEGRADED</div>
          <div className="text-slate-500 mt-2">A background worker polls every {form.polling_interval}s, derives POP/link status via graph reachability, and pushes updates over WebSocket.</div>
        </div>
      </div>
    </div>
  );
}
