import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "../utils/leafletSetup";
import { KHARKIV_CENTER } from "../utils/leafletSetup";
import { useTheme } from "../theme/themeContext";
import { cartoTiles } from "../utils/mapTiles";
import { money } from "./ui/money";
import { fuelLabel, transmissionLabel } from "./cars/carUtils";

function isValidCoordinate(value) {
  const number = Number(value);
  return !Number.isNaN(number) && number !== 0;
}

function PanToCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

/* Violet price-pill marker (CSS lives inline so it travels with the divIcon). */
function priceIcon(car) {
  const available = car.status === "AVAILABLE";
  const dot = available ? "#39d98a" : car.status === "RESERVED" ? "#f5a524" : "#5b8def";
  return L.divIcon({
    className: "drivo-price-pin",
    html: `
      <div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">
        <div style="display:flex;align-items:center;gap:6px;padding:5px 9px;border-radius:99px;
          font-family:'JetBrains Mono',monospace;font-weight:800;font-size:13px;white-space:nowrap;
          background:#7a2bd6;color:#fff;border:1.5px solid #9a4dff;box-shadow:0 6px 18px rgba(0,0,0,0.5);">
          <span style="width:8px;height:8px;border-radius:99px;background:${dot};"></span>${money(car.pricePerHour)}
        </div>
        <div style="width:2px;height:9px;background:#9a4dff;"></div>
      </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export default function CarsMap({ cars, onRent }) {
  const { theme } = useTheme();
  const tiles = cartoTiles(theme);

  const carsWithCoordinates = useMemo(
    () => cars.filter((car) => isValidCoordinate(car.latitude) && isValidCoordinate(car.longitude)),
    [cars]
  );

  const [center, setCenter] = useState(KHARKIV_CENTER);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () => { /* denied / timeout — fall back to Kharkiv */ },
      { timeout: 5000, maximumAge: 60000 }
    );
  }, []);

  // isolation:isolate traps Leaflet's internal z-indexes (panes 200–700, controls 1000) inside
  // this wrapper's own stacking context, so sibling overlays (RentModal, FiltersPanel) render
  // above the map instead of under it (BUG-1).
  return (
    <div className="card" style={{ overflow: "hidden", position: "relative", isolation: "isolate" }}>
      <div style={{ height: "min(72vh, 620px)", position: "relative" }}>
        <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%", background: tiles.bg }}>
          <PanToCenter center={center} />
          <TileLayer key={theme} attribution={tiles.attribution} url={tiles.url} />
          {carsWithCoordinates.map((car) => (
            <Marker key={car.id} position={[Number(car.latitude), Number(car.longitude)]} icon={priceIcon(car)}>
              <Popup>
                <div style={{ minWidth: 210, fontFamily: "var(--font-ui)" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{car.brand} {car.model}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "3px 0 8px" }}>{car.address}</div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                    <span>{car.seats} місць</span><span>{fuelLabel(car)}</span><span>{transmissionLabel(car)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span className="mono" style={{ fontWeight: 800, fontSize: 17, color: "var(--text)" }}>
                      {money(car.pricePerHour)}<span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}> грн/год</span>
                    </span>
                    {car.status === "AVAILABLE" ? (
                      <button className="btn btn-primary" style={{ padding: "7px 13px" }} onClick={() => onRent(car)}>Орендувати</button>
                    ) : (
                      <span className="badge badge--reserved" style={{ fontSize: 11 }}>Недоступне</span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div style={{ position: "absolute", top: 16, left: 16, zIndex: 500, padding: "7px 13px", borderRadius: 99, background: "color-mix(in oklch, var(--surface) 78%, transparent)", backdropFilter: "blur(8px)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, fontWeight: 600, boxShadow: "var(--shadow-md)" }}>
          Авто на мапі: <b className="mono">{carsWithCoordinates.length}</b>
        </div>
      </div>

      {carsWithCoordinates.length === 0 && (
        <div style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 13.5 }}>
          Для відображення на мапі авто повинні мати координати.
        </div>
      )}
    </div>
  );
}
