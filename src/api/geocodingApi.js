// Geocoding via Nominatim (OpenStreetMap) — free, no API key, consistent with
// the OSM tiles used by the maps. NOTE: deliberately uses plain fetch, NOT the
// shared axiosClient, because that points at our backend baseURL and attaches
// the JWT Authorization header (which Nominatim must not receive).
//
// Nominatim usage policy: browsers cannot set a custom User-Agent (Referer is
// sent automatically), max ~1 req/sec — callers must debounce. Fine for the
// demo volume of a diploma project. CORS is allowed (Access-Control-Allow-Origin: *).
const BASE_URL = "https://nominatim.openstreetmap.org";

// Forward geocoding: address text -> list of candidates {display_name, lat, lon}.
export const searchAddress = async (query) => {
    const trimmed = (query || "").trim();
    if (!trimmed) return [];

    const params = new URLSearchParams({
        format: "jsonv2",
        addressdetails: "1",
        limit: "5",
        "accept-language": "uk",
        q: trimmed,
    });

    const response = await fetch(`${BASE_URL}/search?${params.toString()}`, {
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error("Не вдалося виконати пошук адреси");
    }

    return response.json();
};

// Reverse geocoding: coordinates -> a human-readable address (display_name).
export const reverseGeocode = async (latitude, longitude) => {
    const params = new URLSearchParams({
        format: "jsonv2",
        addressdetails: "1",
        "accept-language": "uk",
        lat: String(latitude),
        lon: String(longitude),
    });

    const response = await fetch(`${BASE_URL}/reverse?${params.toString()}`, {
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error("Не вдалося визначити адресу за координатами");
    }

    const data = await response.json();
    return data?.display_name ?? "";
};
