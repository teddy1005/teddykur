import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, Loader2 } from "lucide-react";

const BG =
  "https://images.unsplash.com/photo-1586449480537-3a22cf98b04c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZmliZXIlMjBvcHRpYyUyMG5ldHdvcmslMjBub2RlcyUyMG1hcHxlbnwwfHx8fDE3OTA5NTAxNDd8MA&ixlib=rb-4.1.0&q=85";

export default function Login() {
  const { user, login, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("teddykurnia10@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate("/");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#020617]">
      <div className="relative hidden lg:block overflow-hidden border-r border-slate-800">
        <img src={BG} alt="fiber network" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end p-12">
          <div className="font-heading font-black text-4xl tracking-tight text-white mb-3">
            POP NETWORK<br />MONITORING
          </div>
          <p className="text-slate-300 text-sm max-w-md font-mono">
            Real-time MikroTik &amp; backbone topology intelligence for ISP / FTTH operations centers.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm" data-testid="login-form">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-sm bg-blue-600 flex items-center justify-center">
              <Radio className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-heading font-black text-lg tracking-tight">POP MONITOR</div>
              <div className="text-[10px] text-slate-500 font-mono">NOC CONSOLE ACCESS</div>
            </div>
          </div>

          <h1 className="font-heading font-black text-2xl mb-1">Sign in</h1>
          <p className="text-slate-500 text-sm mb-6">Authenticate to access the console.</p>

          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-slate-400">Email</Label>
              <Input
                data-testid="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-slate-900 border-slate-700 font-mono text-sm"
                required
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-slate-400">Password</Label>
              <Input
                data-testid="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 bg-slate-900 border-slate-700 font-mono text-sm"
                required
              />
            </div>
            {error && (
              <div data-testid="login-error" className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-sm px-3 py-2">
                {error}
              </div>
            )}
            <Button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 rounded-sm font-heading font-bold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ACCESS CONSOLE"}
            </Button>
          </div>
          <p className="text-[11px] text-slate-600 mt-6 font-mono">
            admin: teddykurnia10@gmail.com / PopMonitor#2026
          </p>
        </form>
      </div>
    </div>
  );
}
