import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  Share2,
  Map as MapIcon,
  Cable,
  Bell,
  Activity,
  Settings as SettingsIcon,
  LogOut,
  Radio,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLive } from "@/context/LiveContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/pops", label: "POP", icon: Server },
  { to: "/topology", label: "Topology", icon: Share2 },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/links", label: "Links", icon: Cable },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/monitoring", label: "Monitoring", icon: Activity },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { connected } = useLive();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#020617] text-slate-100">
      {open && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setOpen(false)} />}
      {/* Sidebar */}
      <aside className={cn(
        "w-60 shrink-0 border-r border-slate-800 bg-[#0b1120] flex flex-col h-screen z-40 transition-transform duration-200",
        "fixed lg:sticky top-0 lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-14 flex items-center gap-2 px-4 border-b border-slate-800">
          <div className="h-7 w-7 rounded-sm bg-blue-600 flex items-center justify-center">
            <Radio className="h-4 w-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-heading font-black text-sm tracking-tight">POP MONITOR</div>
            <div className="text-[10px] text-slate-500 font-mono">NOC / FTTH</div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              data-testid={`nav-${n.label.toLowerCase()}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors duration-150",
                  isActive
                    ? "bg-blue-600/15 text-blue-300 border border-blue-600/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent"
                )
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-sm bg-slate-700 flex items-center justify-center font-heading font-bold text-xs uppercase">
              {user?.name?.[0] || "U"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">{user?.role}</div>
            </div>
          </div>
          <button
            data-testid="logout-button"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm text-xs text-slate-400 hover:text-red-300 hover:bg-red-500/10 border border-slate-800 transition-colors duration-150"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 border-b border-slate-800 bg-slate-950/95 backdrop-blur flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setOpen(true)} data-testid="sidebar-toggle"><Menu className="h-5 w-5" /></button>
            <div className="text-xs font-mono text-slate-500 hidden sm:block">
              POP Network Monitoring &amp; Topology
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono" data-testid="live-indicator">
            <span className={cn("relative flex h-2 w-2")}>
              {connected && (
                <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500" />
              )}
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  connected ? "bg-emerald-500" : "bg-slate-600"
                )}
              />
            </span>
            <span className={connected ? "text-emerald-400" : "text-slate-500"}>
              {connected ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
