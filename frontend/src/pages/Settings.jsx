import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Map as MapIcon, Users, Plus, Check, Bell, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";

  const { data: ms } = useQuery({ queryKey: ["map-settings"], queryFn: () => api.get("/map-settings").then((r) => r.data) });
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: () => api.get("/auth/users").then((r) => r.data), enabled: isAdmin });
  const { data: notif } = useQuery({ queryKey: ["notif-settings"], queryFn: () => api.get("/notification-settings").then((r) => r.data), enabled: isAdmin });

  const [provider, setProvider] = useState(null);
  const [osmTile, setOsmTile] = useState(null);
  const [newUser, setNewUser] = useState(null);
  const [nf, setNf] = useState(null);
  const [tn, setTn] = useState(false);
  const cur = { ...(notif || {}), ...(nf || {}) };

  const saveNotif = async () => {
    try {
      const body = { enabled: !!cur.enabled, chat_id: cur.chat_id || "" };
      if (cur.token) body.token = cur.token;
      await api.put("/notification-settings", body);
      toast.success("Notification settings saved");
      setNf(null);
      qc.invalidateQueries({ queryKey: ["notif-settings"] });
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const testNotif = async () => {
    setTn(true);
    try {
      const { data } = await api.post("/notification-settings/test");
      data.ok ? toast.success("Test message sent to Telegram") : toast.error(data.message || "Failed");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
    setTn(false);
  };

  const prov = provider ?? ms?.provider;
  const tile = osmTile ?? ms?.osm_tile;

  const saveMap = async () => {
    try {
      await api.put("/map-settings", { provider: prov, osm_tile: tile });
      toast.success("Map provider updated — topology data unchanged");
      qc.invalidateQueries({ queryKey: ["map-settings"] });
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const createUser = async () => {
    try {
      await api.post("/auth/register", newUser);
      toast.success("User created");
      setNewUser(null);
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  if (!ms) return <div className="p-6 text-slate-500 font-mono text-sm">Loading…</div>;

  const PROVIDERS = [
    { id: "osm", label: "OpenStreetMap / Free", note: "No API key. Leaflet + OSM/CARTO tiles." },
    { id: "google", label: "Google Maps", note: "Google tile layer." },
  ];

  return (
    <div>
      <div className="px-6 py-5 border-b border-slate-800">
        <h1 className="font-heading font-black text-3xl tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm">Map provider abstraction &amp; access control</p>
      </div>

      <div className="p-6 max-w-3xl space-y-6">
        {/* Map provider */}
        <div className="rounded-sm border border-slate-800 bg-[#0b1120]">
          <div className="px-4 py-2.5 border-b border-slate-800 text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2"><MapIcon className="h-3.5 w-3.5" /> Map Provider</div>
          <div className="p-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  data-testid={`provider-${p.id}`}
                  disabled={!isAdmin}
                  onClick={() => setProvider(p.id)}
                  className={cn("text-left rounded-sm border p-3 transition-colors duration-150",
                    prov === p.id ? "border-blue-500 bg-blue-600/10" : "border-slate-700 bg-slate-900 hover:bg-slate-800")}>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-sm">{p.label}</span>
                    {prov === p.id && <Check className="h-4 w-4 text-blue-400" />}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">{p.note}</div>
                </button>
              ))}
            </div>
            {prov === "osm" && (
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-slate-500">OSM Tile Style</Label>
                <Select value={tile} onValueChange={setOsmTile} disabled={!isAdmin}>
                  <SelectTrigger data-testid="osm-tile-select" className="bg-slate-900 border-slate-700 mt-1 font-mono"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                    <SelectItem value="cartodb_dark">CARTO Dark Matter</SelectItem>
                    <SelectItem value="osm_standard">OSM Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="text-[11px] text-slate-500 font-mono">POP coordinates, links, polylines and topology are provider-independent — switching providers never changes your data.</div>
            {isAdmin && <Button data-testid="save-map-btn" onClick={saveMap} className="bg-blue-600 hover:bg-blue-500 rounded-sm">Save Provider</Button>}
          </div>
        </div>

        {/* Telegram Alerts */}
        {isAdmin && (
          <div className="rounded-sm border border-slate-800 bg-[#0b1120]">
            <div className="px-4 py-2.5 border-b border-slate-800 text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2"><Bell className="h-3.5 w-3.5" /> Telegram Alerts</div>
            <div className="p-4 space-y-4">
              <label className="flex items-center gap-2 text-sm text-slate-300"><Switch data-testid="notif-enabled" checked={!!cur.enabled} onCheckedChange={(v) => setNf({ ...(nf || {}), enabled: v })} /> Send Telegram alert when a POP or link goes <b className="text-red-400">DOWN</b></label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label className="text-[10px] uppercase tracking-widest text-slate-500">Bot Token</Label><Input data-testid="notif-token" type="password" placeholder={cur.has_token ? "•••••••• (saved)" : "from @BotFather"} value={cur.token || ""} onChange={(e) => setNf({ ...(nf || {}), token: e.target.value })} className="bg-slate-900 border-slate-700 mt-1 font-mono" /></div>
                <div><Label className="text-[10px] uppercase tracking-widest text-slate-500">Chat ID</Label><Input data-testid="notif-chatid" value={cur.chat_id || ""} onChange={(e) => setNf({ ...(nf || {}), chat_id: e.target.value })} placeholder="e.g. -1001234567890" className="bg-slate-900 border-slate-700 mt-1 font-mono" /></div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">Create a bot via @BotFather for the token. Message the bot (or add it to a group) to obtain the Chat ID.</div>
              <div className="flex gap-2">
                <Button data-testid="notif-save-btn" onClick={saveNotif} className="bg-blue-600 hover:bg-blue-500 rounded-sm">Save</Button>
                <Button data-testid="notif-test-btn" variant="outline" disabled={tn} onClick={testNotif} className="border-slate-600 bg-transparent hover:bg-slate-800">{tn ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Send className="h-4 w-4 mr-1" /> Send Test</>)}</Button>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {isAdmin && (
          <div className="rounded-sm border border-slate-800 bg-[#0b1120]">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Users &amp; Roles</span>
              <Button size="sm" data-testid="new-user-btn" onClick={() => setNewUser({ email: "", password: "", name: "", role: "viewer" })} className="h-7 bg-blue-600 hover:bg-blue-500 text-xs"><Plus className="h-3.5 w-3.5 mr-1" /> Add User</Button>
            </div>
            <div className="p-4 space-y-2">
              {(users || []).map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm border border-slate-800 rounded-sm px-3 py-2 font-mono">
                  <span>{u.email}</span>
                  <span className={cn("text-[10px] uppercase px-2 py-0.5 rounded border",
                    u.role === "admin" ? "text-red-300 border-red-500/40" : u.role === "operator" ? "text-amber-300 border-amber-500/40" : "text-sky-300 border-sky-500/40")}>{u.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!newUser} onOpenChange={(o) => !o && setNewUser(null)}>
        <DialogContent className="bg-[#0b1120] border-slate-700 text-slate-100">
          <DialogHeader><DialogTitle className="font-heading">New User</DialogTitle></DialogHeader>
          {newUser && (
            <div className="space-y-3">
              <div><Label className="text-[10px] uppercase tracking-widest text-slate-500">Name</Label><Input data-testid="user-name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="bg-slate-900 border-slate-700 mt-1" /></div>
              <div><Label className="text-[10px] uppercase tracking-widest text-slate-500">Email</Label><Input data-testid="user-email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="bg-slate-900 border-slate-700 mt-1 font-mono" /></div>
              <div><Label className="text-[10px] uppercase tracking-widest text-slate-500">Password</Label><Input data-testid="user-password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="bg-slate-900 border-slate-700 mt-1 font-mono" /></div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-slate-500">Role</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger data-testid="user-role" className="bg-slate-900 border-slate-700 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="operator">operator</SelectItem>
                    <SelectItem value="viewer">viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewUser(null)}>Cancel</Button>
            <Button data-testid="user-save" onClick={createUser} className="bg-blue-600 hover:bg-blue-500">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
