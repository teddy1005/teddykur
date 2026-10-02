import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import api from "@/lib/api";
import { getStatus, REASON_LABEL } from "@/lib/status";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Cable, MousePointer2, X } from "lucide-react";

const TILES = {
  cartodb_dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    sub: ["a", "b", "c", "d"],
    attr: "© OpenStreetMap, © CARTO",
  },
  osm_standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    sub: ["a", "b", "c"],
    attr: "© OpenStreetMap",
  },
  google: {
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    sub: ["mt0", "mt1", "mt2", "mt3"],
    attr: "© Google",
  },
};

function makeIcon(status, code) {
  const s = getStatus(status);
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-50%)">
      <div style="background:#0b1120;border:1px solid #334155;color:#e2e8f0;font:600 10px 'IBM Plex Mono',monospace;padding:1px 4px;border-radius:3px;white-space:nowrap;margin-bottom:2px">${code}</div>
      <div style="width:16px;height:16px;border-radius:50%;background:${s.hex};border:2px solid #0b1120;box-shadow:0 0 8px ${s.hex}"></div>
    </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
}

export default function MapView() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = user?.role === "admin" || user?.role === "operator";

  const { data: ms } = useQuery({ queryKey: ["map-settings"], queryFn: () => api.get("/map-settings").then((r) => r.data) });
  const { data: topo } = useQuery({ queryKey: ["topology"], queryFn: () => api.get("/topology").then((r) => r.data), refetchInterval: 10000 });

  const [mode, setMode] = useState("view"); // view | addpop | addlink
  const [popForm, setPopForm] = useState(null);
  const [linkFrom, setLinkFrom] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [linkForm, setLinkForm] = useState(null);

  const tile = useMemo(() => {
    if (!ms) return TILES.cartodb_dark;
    if (ms.provider === "google") return TILES.google;
    return TILES[ms.osm_tile] || TILES.cartodb_dark;
  }, [ms]);

  const pops = topo?.pops || [];
  const links = topo?.links || [];
  const popById = useMemo(() => Object.fromEntries(pops.map((p) => [p.id, p])), [pops]);

  const onMapClick = (latlng) => {
    if (mode === "addpop") {
      setPopForm({ name: "", code: "", address: "", mikrotik_ip: "", gateway_ip: "", interfaces: "ether1,ether2", is_core: false, description: "", latitude: latlng.lat.toFixed(6), longitude: latlng.lng.toFixed(6) });
    } else if (mode === "addlink" && linkFrom) {
      setWaypoints((w) => [...w, [latlng.lat, latlng.lng]]);
    }
  };

  const onMarkerClick = (p) => {
    if (mode !== "addlink") return;
    if (!linkFrom) {
      setLinkFrom(p);
      toast.info(`Start: ${p.code}. Click waypoints then the destination POP.`);
    } else if (p.id !== linkFrom.id) {
      const route = [[linkFrom.latitude, linkFrom.longitude], ...waypoints, [p.latitude, p.longitude]];
      setLinkForm({
        pop_a: linkFrom.id, pop_b: p.id, iface_a: linkFrom.interfaces?.[0]?.name || "", iface_b: p.interfaces?.[0]?.name || "",
        cable_type: "Fiber Optic G.652D", capacity: "10Gbps", name: `${linkFrom.code}-${p.code}`, route,
      });
    }
  };

  const savePop = async () => {
    try {
      await api.post("/pops", {
        ...popForm,
        latitude: parseFloat(popForm.latitude),
        longitude: parseFloat(popForm.longitude),
        interfaces: popForm.interfaces.split(",").map((s) => s.trim()).filter(Boolean),
        simulation_enabled: true,
      });
      toast.success("POP created");
      setPopForm(null);
      setMode("view");
      qc.invalidateQueries({ queryKey: ["topology"] });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to create POP");
    }
  };

  const saveLink = async () => {
    try {
      await api.post("/links", linkForm);
      toast.success("Cable link created");
      cancelLink();
      qc.invalidateQueries({ queryKey: ["topology"] });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to create link");
    }
  };

  const cancelLink = () => {
    setLinkForm(null);
    setLinkFrom(null);
    setWaypoints([]);
    setMode("view");
  };

  const onDragEnd = async (p, e) => {
    const { lat, lng } = e.target.getLatLng();
    try {
      await api.put(`/pops/${p.id}`, { latitude: lat, longitude: lng });
      qc.invalidateQueries({ queryKey: ["topology"] });
    } catch (_) {
      toast.error("Move not allowed");
    }
  };

  if (!ms || !topo) return <div className="p-6 text-slate-500 font-mono text-sm">Loading map…</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-black text-2xl tracking-tight">Map View</h1>
          <p className="text-slate-500 text-xs font-mono">Provider: {ms.provider.toUpperCase()} · {pops.length} POP · {links.length} links</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <ModeBtn active={mode === "view"} onClick={() => { setMode("view"); cancelLink(); }} icon={MousePointer2} label="View" testid="map-mode-view" />
            <ModeBtn active={mode === "addpop"} onClick={() => setMode("addpop")} icon={MapPin} label="Add POP" testid="map-mode-addpop" />
            <ModeBtn active={mode === "addlink"} onClick={() => { setMode("addlink"); setLinkFrom(null); setWaypoints([]); }} icon={Cable} label="Draw Link" testid="map-mode-addlink" />
          </div>
        )}
      </div>

      {mode !== "view" && (
        <div className="px-6 py-2 bg-blue-600/10 border-b border-blue-600/30 text-xs text-blue-300 font-mono flex items-center justify-between">
          <span>
            {mode === "addpop" && "Click anywhere on the map to place a new POP."}
            {mode === "addlink" && (linkFrom ? `Drawing from ${linkFrom.code} — click waypoints, then click destination POP. Waypoints: ${waypoints.length}` : "Click the source POP marker to begin.")}
          </span>
          <button onClick={cancelLink} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex-1" data-testid="map-canvas">
        <MapContainer center={[ms.center_lat, ms.center_lng]} zoom={ms.zoom} style={{ height: "100%", width: "100%" }}>
          <TileLayer url={tile.url} subdomains={tile.sub} attribution={tile.attr} />
          <ClickHandler onClick={onMapClick} />

          {links.map((l) => {
            const s = getStatus(l.status);
            return (
              <Polyline key={l.id} positions={l.route} pathOptions={{ color: s.hex, weight: 3, dashArray: l.status === "DOWN" ? "6 6" : undefined, opacity: 0.9 }}>
                <Tooltip sticky>
                  <div className="font-mono text-xs">
                    <div className="font-bold">{l.name}</div>
                    <div>{l.status} · {REASON_LABEL[l.status_reason]}</div>
                    <div>{l.distance_km} km · {l.capacity}</div>
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

          {linkFrom && waypoints.length > 0 && (
            <Polyline positions={[[linkFrom.latitude, linkFrom.longitude], ...waypoints]} pathOptions={{ color: "#3b82f6", weight: 2, dashArray: "4 6" }} />
          )}

          {pops.map((p) => (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
              icon={makeIcon(p.status, p.code)}
              draggable={canEdit && mode === "view"}
              eventHandlers={{ click: () => onMarkerClick(p), dragend: (e) => onDragEnd(p, e) }}
            >
              <Popup>
                <div className="font-mono text-xs space-y-0.5" data-testid={`map-popup-${p.code}`}>
                  <div className="font-heading font-bold text-sm">{p.name}</div>
                  <div>Status: <b style={{ color: getStatus(p.status).hex }}>{p.status}</b></div>
                  <div>IP: {p.mikrotik_ip || "—"}</div>
                  <div>Latency: {p.latency ?? "—"} ms · Loss: {p.packet_loss ?? 0}%</div>
                  <div>CPU: {p.cpu}% · RAM: {p.ram_pct}%</div>
                  <div>Links: {p.link_count}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Add POP dialog */}
      <Dialog open={!!popForm} onOpenChange={(o) => !o && setPopForm(null)}>
        <DialogContent className="bg-[#0b1120] border-slate-700 text-slate-100">
          <DialogHeader><DialogTitle className="font-heading">New POP</DialogTitle></DialogHeader>
          {popForm && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Name"><Input data-testid="pop-form-name" value={popForm.name} onChange={(e) => setPopForm({ ...popForm, name: e.target.value })} className="bg-slate-900 border-slate-700" /></Field>
              <Field label="Code"><Input data-testid="pop-form-code" value={popForm.code} onChange={(e) => setPopForm({ ...popForm, code: e.target.value })} className="bg-slate-900 border-slate-700" /></Field>
              <Field label="Latitude"><Input value={popForm.latitude} onChange={(e) => setPopForm({ ...popForm, latitude: e.target.value })} className="bg-slate-900 border-slate-700 font-mono" /></Field>
              <Field label="Longitude"><Input value={popForm.longitude} onChange={(e) => setPopForm({ ...popForm, longitude: e.target.value })} className="bg-slate-900 border-slate-700 font-mono" /></Field>
              <Field label="MikroTik IP"><Input value={popForm.mikrotik_ip} onChange={(e) => setPopForm({ ...popForm, mikrotik_ip: e.target.value })} className="bg-slate-900 border-slate-700 font-mono" /></Field>
              <Field label="Gateway IP"><Input value={popForm.gateway_ip} onChange={(e) => setPopForm({ ...popForm, gateway_ip: e.target.value })} className="bg-slate-900 border-slate-700 font-mono" /></Field>
              <Field label="Address" span><Input value={popForm.address} onChange={(e) => setPopForm({ ...popForm, address: e.target.value })} className="bg-slate-900 border-slate-700" /></Field>
              <Field label="Interfaces (comma)" span><Input value={popForm.interfaces} onChange={(e) => setPopForm({ ...popForm, interfaces: e.target.value })} className="bg-slate-900 border-slate-700 font-mono" /></Field>
              <div className="flex items-center gap-2 col-span-2">
                <Switch checked={popForm.is_core} onCheckedChange={(v) => setPopForm({ ...popForm, is_core: v })} data-testid="pop-form-core" />
                <span className="text-xs text-slate-400">Core POP (connected to monitoring/upstream)</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPopForm(null)}>Cancel</Button>
            <Button data-testid="pop-form-save" onClick={savePop} className="bg-blue-600 hover:bg-blue-500">Save POP</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Link dialog */}
      <Dialog open={!!linkForm} onOpenChange={(o) => !o && cancelLink()}>
        <DialogContent className="bg-[#0b1120] border-slate-700 text-slate-100">
          <DialogHeader><DialogTitle className="font-heading">New Cable Link</DialogTitle></DialogHeader>
          {linkForm && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Link Name" span><Input value={linkForm.name} onChange={(e) => setLinkForm({ ...linkForm, name: e.target.value })} className="bg-slate-900 border-slate-700 font-mono" /></Field>
              <Field label={`${popById[linkForm.pop_a]?.code} Interface`}>
                <IfaceSelect pop={popById[linkForm.pop_a]} value={linkForm.iface_a} onChange={(v) => setLinkForm({ ...linkForm, iface_a: v })} testid="link-iface-a" />
              </Field>
              <Field label={`${popById[linkForm.pop_b]?.code} Interface`}>
                <IfaceSelect pop={popById[linkForm.pop_b]} value={linkForm.iface_b} onChange={(v) => setLinkForm({ ...linkForm, iface_b: v })} testid="link-iface-b" />
              </Field>
              <Field label="Cable Type"><Input value={linkForm.cable_type} onChange={(e) => setLinkForm({ ...linkForm, cable_type: e.target.value })} className="bg-slate-900 border-slate-700" /></Field>
              <Field label="Capacity"><Input value={linkForm.capacity} onChange={(e) => setLinkForm({ ...linkForm, capacity: e.target.value })} className="bg-slate-900 border-slate-700 font-mono" /></Field>
              <div className="col-span-2 text-xs text-slate-500 font-mono">Route points: {linkForm.route.length}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={cancelLink}>Cancel</Button>
            <Button data-testid="link-form-save" onClick={saveLink} className="bg-blue-600 hover:bg-blue-500">Save Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModeBtn({ active, onClick, icon: Icon, label, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs border transition-colors duration-150 ${
        active ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function Field({ label, children, span }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <Label className="text-[10px] uppercase tracking-widest text-slate-500">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function IfaceSelect({ pop, value, onChange, testid }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger data-testid={testid} className="bg-slate-900 border-slate-700 font-mono"><SelectValue /></SelectTrigger>
      <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
        {(pop?.interfaces || []).map((i) => (
          <SelectItem key={i.name} value={i.name}>{i.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
