/* Cross-component signal that the auth token changed (login / logout).
   Login navigates client-side (no full reload — see LoginPage), so a long-lived
   provider mounted at app start wouldn't otherwise notice a token appearing.
   RealtimeProvider listens for this to (re)open / close the WebSocket. */
export const AUTH_CHANGED = "auth:changed";

export const notifyAuthChanged = () => {
    window.dispatchEvent(new Event(AUTH_CHANGED));
};
