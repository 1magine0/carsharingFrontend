import { createContext, useContext } from "react";

/* Realtime (WebSocket/STOMP) context + hook live here — not in the provider
   .jsx — so the provider file only exports a component (keeps fast-refresh happy,
   mirroring themeContext.js). */
export const RealtimeContext = createContext(null);

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used within <RealtimeProvider>");
  return ctx;
}
