// Returns the URL only if it uses a safe http(s) scheme; otherwise null.
// Guards against javascript:/data: URLs coming from backend-controlled fields
// (e.g. image URLs rendered into <a href>), which would otherwise enable XSS.
export function safeHttpUrl(url) {
    if (typeof url !== "string") return null;

    try {
        const parsed = new URL(url, window.location.origin);
        return parsed.protocol === "http:" || parsed.protocol === "https:" ? url : null;
    } catch {
        return null;
    }
}
