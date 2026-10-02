export const STATUS = {
  UP: { label: "UP", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-500", hex: "#10b981" },
  DOWN: { label: "DOWN", text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/50", dot: "bg-red-500", hex: "#ef4444" },
  DEGRADED: { label: "DEGRADED", text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", dot: "bg-amber-500", hex: "#f59e0b" },
  UNKNOWN: { label: "UNKNOWN", text: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-600/40", dot: "bg-slate-500", hex: "#64748b" },
};

export const getStatus = (s) => STATUS[s] || STATUS.UNKNOWN;

export const REASON_LABEL = {
  OK: "Operational",
  ROUTER_DOWN: "Router Down",
  INTERFACE_DOWN: "Interface Down",
  LINK_UNREACHABLE: "Link Unreachable",
  HIGH_LATENCY: "High Latency",
  PACKET_LOSS: "Packet Loss",
  ALTERNATIVE_PATH: "Alternative Path Active",
  MONITORING_ERROR: "Monitoring Error",
  UNKNOWN: "Unknown",
};

export const SEVERITY = {
  critical: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/40" },
  warning: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  info: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30" },
};

export function fmtBytes(n) {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${u[i]}`;
}

export function fmtUptime(sec) {
  if (!sec) return "0m";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${d ? d + "d " : ""}${h ? h + "h " : ""}${m}m`;
}
