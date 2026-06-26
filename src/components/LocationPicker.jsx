import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "../utils/leafletSetup";
import { KHARKIV_CENTER } from "../utils/leafletSetup";
import { reverseGeocode, searchAddress } from "../api/geocodingApi";

// car_locations stores latitude/longitude as DECIMAL(10,7) — round to 7 places.
function round7(value) {
    return Number(Number(value).toFixed(7));
}

function toNumberOrNull(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
}

/* Field label — matches CarFormModal's Field style (design system). */
function Label({ children }) {
    return (
        <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 7 }}>
            {children}
        </label>
    );
}

// Recenters the map whenever `center` changes (e.g. after picking a search result).
function Recenter({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

// Turns a click anywhere on the map into a location pick.
function ClickHandler({ onPick }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export default function LocationPicker({ value, onChange }) {
    const lat = toNumberOrNull(value?.latitude);
    const lng = toNumberOrNull(value?.longitude);
    const hasCoords = lat !== null && lng !== null;

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [resolvingAddress, setResolvingAddress] = useState(false);

    // Map view center: pre-selected coords (edit) else Kharkiv; geolocation may
    // refine it on create when nothing is selected yet.
    const [center, setCenter] = useState(hasCoords ? [lat, lng] : KHARKIV_CENTER);

    useEffect(() => {
        if (hasCoords || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
            () => {
                // denied / timeout — keep Kharkiv fallback
            },
            { timeout: 5000, maximumAge: 60000 }
        );
        // run once on mount for the create flow
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounced forward geocoding as the admin types. All setState lives inside the
    // async IIFE (react-hooks/set-state-in-effect); the `alive` flag cancels stale
    // responses and the pending debounce timer on cleanup.
    useEffect(() => {
        const trimmed = query.trim();
        let alive = true;
        let timer;

        void (async () => {
            if (trimmed.length < 3) {
                if (alive) { setResults([]); setSearchError(""); }
                return;
            }
            await new Promise((resolve) => { timer = setTimeout(resolve, 600); });
            if (!alive) return;

            setSearching(true);
            setSearchError("");
            try {
                const found = await searchAddress(trimmed);
                if (alive) setResults(found);
            } catch {
                if (alive) { setSearchError("Помилка пошуку адреси. Спробуйте ще раз."); setResults([]); }
            } finally {
                if (alive) setSearching(false);
            }
        })();

        return () => { alive = false; clearTimeout(timer); };
    }, [query]);

    const applyPick = async (pickedLat, pickedLng) => {
        const rLat = round7(pickedLat);
        const rLng = round7(pickedLng);
        onChange({ latitude: rLat, longitude: rLng });

        setResolvingAddress(true);
        try {
            const address = await reverseGeocode(rLat, rLng);
            if (address) onChange({ address });
        } catch {
            // keep coordinates even if reverse geocoding fails
        } finally {
            setResolvingAddress(false);
        }
    };

    const handleSelectResult = (result) => {
        const rLat = round7(result.lat);
        const rLng = round7(result.lon);
        onChange({ address: result.display_name, latitude: rLat, longitude: rLng });
        setCenter([rLat, rLng]);
        setResults([]);
        setQuery("");
    };

    const markerPosition = hasCoords ? [lat, lng] : null;

    return (
        <div>
            <Label>Місцезнаходження</Label>

            {/* Address search */}
            <div style={{ position: "relative", marginBottom: 10 }}>
                <input
                    type="text"
                    className="input"
                    placeholder="Пошук адреси (напр. Сумська 1, Харків)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                />

                {(searching || results.length > 0 || searchError) && (
                    <div style={{
                        position: "absolute", width: "100%", zIndex: 2000, maxHeight: 240, overflowY: "auto", marginTop: 4,
                        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", boxShadow: "var(--shadow-lg)",
                    }}>
                        {searching && <div style={{ padding: "9px 14px", color: "var(--text-muted)", fontSize: 13.5 }}>Пошук…</div>}
                        {searchError && <div style={{ padding: "9px 14px", color: "var(--danger)", fontSize: 13.5 }}>{searchError}</div>}

                        {!searching && results.map((result) => (
                            <button
                                type="button"
                                key={`${result.place_id ?? result.osm_id}-${result.lat}`}
                                onClick={() => handleSelectResult(result)}
                                style={{
                                    display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none",
                                    background: "transparent", color: "var(--text)", fontSize: 13.5, cursor: "pointer", fontFamily: "inherit",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                                {result.display_name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Interactive map. isolation:isolate keeps Leaflet's z-indexes from leaking
                above the search dropdown / surrounding modal (BUG-1 lesson). */}
            <div style={{ height: 320, borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--border)", marginBottom: 10, isolation: "isolate" }}>
                <MapContainer
                    center={center}
                    zoom={hasCoords ? 15 : 12}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                >
                    <Recenter center={center} />
                    <ClickHandler onPick={applyPick} />

                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {markerPosition && (
                        <Marker
                            position={markerPosition}
                            draggable={true}
                            eventHandlers={{
                                dragend(e) {
                                    const { lat: dLat, lng: dLng } = e.target.getLatLng();
                                    applyPick(dLat, dLng);
                                },
                            }}
                        />
                    )}
                </MapContainer>
            </div>

            <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--text-muted)" }}>
                Введіть адресу в полі пошуку або клікніть на карті — координати визначаться автоматично.
                Маркер можна перетягнути для уточнення.
            </p>

            {/* Editable address (auto-filled by reverse geocoding, admin may tweak the label) */}
            <div style={{ marginBottom: 12 }}>
                <Label>
                    Адреса {resolvingAddress && <span style={{ color: "var(--text-faint)", textTransform: "none", letterSpacing: 0, fontWeight: 600 }}>(визначення…)</span>}
                </Label>
                <input
                    className="input"
                    name="address"
                    value={value?.address ?? ""}
                    onChange={(e) => onChange({ address: e.target.value })}
                    placeholder="Заповниться автоматично після вибору точки"
                />
            </div>

            {/* Read-only coordinates for transparency */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                    <Label>Широта (latitude)</Label>
                    <input className="input mono" value={lat ?? ""} readOnly placeholder="—" />
                </div>
                <div>
                    <Label>Довгота (longitude)</Label>
                    <input className="input mono" value={lng ?? ""} readOnly placeholder="—" />
                </div>
            </div>
        </div>
    );
}
