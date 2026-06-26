import { notifyAuthChanged } from "./authEvents";

// FE-3: the JWT now lives in an HttpOnly cookie that JS cannot read. We keep only
// a non-sensitive {email, role} snapshot in localStorage so route guards and the
// navbar can render synchronously. This is NOT a security boundary — the backend
// independently enforces auth and ADMIN access on every request; tampering with
// this value only changes what the UI optimistically shows before the server
// rejects the call (401/403).
export const AUTH_KEY = "auth";

export const saveAuthData = ({ email, role }) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ email, role }));
    notifyAuthChanged();
};

export const getAuthUser = () => {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const getRole = () => {
    return getAuthUser()?.role ?? null;
};

export const isAdmin = () => {
    return getRole() === "ADMIN";
};

export const removeAuthData = () => {
    localStorage.removeItem(AUTH_KEY);
    notifyAuthChanged();
};

export const isAuthenticated = () => {
    // Presence of the snapshot means "logged in as far as the UI knows". The
    // cookie's real validity is the server's call — an expired cookie yields a
    // 401, which the axios interceptor turns into removeAuthData() + redirect.
    return getAuthUser() !== null;
};
