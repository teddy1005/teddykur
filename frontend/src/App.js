import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { LiveProvider } from "@/context/LiveContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Pops from "@/pages/Pops";
import Topology from "@/pages/Topology";
import MapView from "@/pages/MapView";
import Links from "@/pages/Links";
import Alerts from "@/pages/Alerts";
import Monitoring from "@/pages/Monitoring";
import Settings from "@/pages/Settings";

const Shell = ({ children }) => (
  <ProtectedRoute>
    <LiveProvider>
      <Layout>{children}</Layout>
    </LiveProvider>
  </ProtectedRoute>
);

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Shell><Dashboard /></Shell>} />
            <Route path="/pops" element={<Shell><Pops /></Shell>} />
            <Route path="/topology" element={<Shell><Topology /></Shell>} />
            <Route path="/map" element={<Shell><MapView /></Shell>} />
            <Route path="/links" element={<Shell><Links /></Shell>} />
            <Route path="/alerts" element={<Shell><Alerts /></Shell>} />
            <Route path="/monitoring" element={<Shell><Monitoring /></Shell>} />
            <Route path="/settings" element={<Shell><Settings /></Shell>} />
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" theme="dark" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
