import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsUrl } from "@/lib/api";

const LiveContext = createContext({ connected: false, lastTs: null });

export function LiveProvider({ children }) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [lastTs, setLastTs] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    let stop = false;
    let retry;
    const connect = () => {
      if (stop) return;
      try {
        const ws = new WebSocket(wsUrl());
        wsRef.current = ws;
        ws.onopen = () => setConnected(true);
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === "update") {
              setLastTs(msg.ts);
              ["dashboard", "topology", "pops", "links", "alerts"].forEach((k) =>
                qc.invalidateQueries({ queryKey: [k] })
              );
            }
          } catch (_) {}
        };
        ws.onclose = () => {
          setConnected(false);
          if (!stop) retry = setTimeout(connect, 3000);
        };
        ws.onerror = () => ws.close();
      } catch (_) {
        retry = setTimeout(connect, 3000);
      }
    };
    connect();
    return () => {
      stop = true;
      clearTimeout(retry);
      wsRef.current && wsRef.current.close();
    };
  }, [qc]);

  return (
    <LiveContext.Provider value={{ connected, lastTs }}>{children}</LiveContext.Provider>
  );
}

export const useLive = () => useContext(LiveContext);
