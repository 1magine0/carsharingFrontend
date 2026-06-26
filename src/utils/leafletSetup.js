// Shared Leaflet setup. Imported for its side effect (fixing the default marker
// icon URLs that Vite would otherwise break) by every component that renders a
// Leaflet map. Keeping it in one module avoids duplicating the icon fix.
import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// Default map center (Kharkiv) used as a fallback when geolocation is
// unavailable and no coordinates are pre-selected.
export const KHARKIV_CENTER = [49.9935, 36.2304];
