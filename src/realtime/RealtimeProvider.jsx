import { useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { isAuthenticated } from "../utils/auth";
import { AUTH_CHANGED } from "../utils/authEvents";
import { RealtimeContext } from "./realtimeContext";

/* Resolve the WebSocket endpoint. Explicit VITE_WS_URL wins; otherwise derive it
   from the page origin — the Vite dev proxy (and a same-origin prod deploy)
   expose /ws on the same host, so the HttpOnly auth cookie rides the handshake. */
function resolveWsUrl() {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) return explicit;
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

/* Parse a STOMP frame body as JSON, falling back to the raw string. */
function parseBody(frame) {
  try {
    return JSON.parse(frame.body);
  } catch {
    return frame.body;
  }
}

/**
 * Single STOMP-over-WebSocket connection for the whole app. Connects only when the
 * user is logged in and reconnects automatically. Authentication rides the HttpOnly
 * auth cookie on the WS handshake (FE-3) — no token is read in JS — so the CONNECT
 * frame carries no credentials. Consumers call `subscribe(destination, cb)`
 * regardless of connection timing — pending subscriptions are (re)bound on every
 * (re)connect, so a dropped socket transparently re-establishes all topics.
 */
export function RealtimeProvider({ children }) {
  const clientRef = useRef(null);
  // destination -> Map<id, { callback, stompSub }>
  const subsRef = useRef(new Map());
  const [authed, setAuthed] = useState(isAuthenticated);
  const [connected, setConnected] = useState(false);

  // Track login/logout so the socket opens after a client-side login and closes
  // on logout (both go through saveAuthData/removeAuthData -> AUTH_CHANGED).
  useEffect(() => {
    const sync = () => setAuthed(isAuthenticated());
    window.addEventListener(AUTH_CHANGED, sync);
    window.addEventListener("storage", sync); // other tabs
    return () => {
      window.removeEventListener(AUTH_CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!authed) return; // anonymous (login/register) — no socket

    // Stable Map reference (never reassigned, only mutated) — safe to capture for
    // use in onConnect / cleanup without tripping the exhaustive-deps ref warning.
    const subs = subsRef.current;

    const client = new Client({
      // No connectHeaders: the auth cookie authenticates the handshake (FE-3).
      brokerURL: resolveWsUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      setConnected(true);
      // (Re)bind every registered subscription. Stale stompSubs from a previous
      // connection are dead, so re-subscribing here is the correct reconnect path.
      subs.forEach((byId, destination) => {
        byId.forEach((entry) => {
          entry.stompSub = client.subscribe(destination, (frame) => entry.callback(parseBody(frame)));
        });
      });
    };
    client.onWebSocketClose = () => setConnected(false);
    client.onStompError = (frame) => {
      // CONNECT rejected (e.g. expired/invalid token).
      console.warn("STOMP error:", frame?.headers?.message);
    };

    clientRef.current = client;
    client.activate();

    return () => {
      subs.forEach((byId) =>
        byId.forEach((entry) => {
          entry.stompSub?.unsubscribe?.();
          entry.stompSub = null;
        }));
      void client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [authed]);

  const value = useMemo(() => ({
    connected,
    subscribe(destination, callback) {
      const id = Symbol("sub");
      let byId = subsRef.current.get(destination);
      if (!byId) {
        byId = new Map();
        subsRef.current.set(destination, byId);
      }
      const entry = { callback, stompSub: null };
      byId.set(id, entry);

      const client = clientRef.current;
      if (client && client.connected) {
        entry.stompSub = client.subscribe(destination, (frame) => entry.callback(parseBody(frame)));
      }

      return () => {
        entry.stompSub?.unsubscribe?.();
        byId.delete(id);
        if (byId.size === 0) subsRef.current.delete(destination);
      };
    },
  }), [connected]);

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}
