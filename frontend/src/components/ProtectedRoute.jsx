import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-400 font-mono text-sm">
        Initializing monitoring console...
      </div>
    );
  if (user === false) return <Navigate to="/login" replace />;
  return children;
}
