import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "../utils/leafletSetup";
import { getCarByIdRequest } from "../api/carsApi";
import { isAdmin } from "../utils/auth";
import { useRealtime } from "../realtime/realtimeContext";
import { useTheme } from "../theme/themeContext";
import { cartoTiles } from "../utils/mapTiles";
import { Icons } from "../components/ui/Icons";
import { money } from "../components/ui/money";
import { StatusBadge } from "../components/ui/StatusBadge";
import { fuelLabel, transmissionLabel, getCarCity } from "../components/cars/carUtils";
import { RentModal } from "../components/cars/RentModal";
import CarFormModal from "../components/cars/CarFormModal";

/* Violet glow pin matching the catalog map style. */
const detailPin = L.divIcon({
  className: "drivo-detail-pin",
  html: `<div style="transform:translate(-50%,-100%);filter:drop-shadow(0 4px 10px rgba(0,0,0,0.55));">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="#7a2bd6" stroke="#fff" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z"/><circle cx="12" cy="10" r="2.5" fill="#fff" stroke="none"/>
      </svg></div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

function hasCoords(car) {
  const lat = Number(car?.latitude), lng = Number(car?.longitude);
  return !Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0);
}

/* Single gallery photo: real image when present, else striped placeholder. */
function GalleryPhoto({ src, alt, height }) {
  if (src) {
    return <img src={src} alt={alt} style={{ height, width: "100%", objectFit: "cover", display: "block" }} />;
  }
  return (
    <div className="img-ph" style={{ height }}>
      <span>{alt}</span>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 90% at 50% 120%, var(--accent-soft), transparent 60%)", opacity: 0.5, pointerEvents: "none" }} />
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <main style={{ maxWidth: 1160, margin: "0 auto", padding: "24px 24px 80px" }}>
      <div className="skel" style={{ height: 36, width: 140, marginBottom: 18 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 28, alignItems: "start" }} className="details-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="skel" style={{ height: 380, borderRadius: "var(--r-lg)" }} />
          <div className="skel" style={{ height: 40, width: "60%" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="specs-grid">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 86, borderRadius: "var(--r-md)" }} />)}
          </div>
        </div>
        <div className="skel" style={{ height: 320, borderRadius: "var(--r-lg)" }} />
      </div>
    </main>
  );
}

export default function CarDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const admin = isAdmin();
  const { subscribe } = useRealtime();
  const { theme } = useTheme();
  const tiles = cartoTiles(theme);

  // The catalog passes the card via router-state so we can render fields the
  // CarDetailsResponse DTO omits (status / registrationNumber / city — Д7).
  const cardFromState = location.state?.card;

  const [car, setCar] = useState(cardFromState || null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mainIdx, setMainIdx] = useState(0);
  const [rentOpen, setRentOpen] = useState(false);
  const [adminEdit, setAdminEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    setNotFound(false);
    setMainIdx(0);
    try {
      const details = await getCarByIdRequest(id);
      // Details override the card, but card-only fields (status, registration
      // number, city, imageUrl fallback) survive the merge.
      setCar((prev) => ({ ...(prev || cardFromState || {}), ...details }));
    } catch (err) {
      if (err?.response?.status === 404) setNotFound(true);
      else toast.error("Не вдалося завантажити дані авто");
    } finally {
      setLoading(false);
    }
  };

  // setState lives inside the async load(), not the effect body (avoids the
  // set-state-in-effect lint, matching the CarsPage pattern).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void (async () => { await load(); })(); }, [id]);

  // Live status for this car (/topic/cars): keep the badge + rent button in sync
  // if the car is booked/returned elsewhere while the page is open.
  useEffect(() => {
    const off = subscribe("/topic/cars", ({ carId, status }) => {
      if (String(carId) === String(id)) {
        setCar((prev) => (prev ? { ...prev, status } : prev));
      }
    });
    return off;
  }, [subscribe, id]);

  const images = useMemo(() => {
    if (Array.isArray(car?.images) && car.images.length) return car.images;
    if (car?.imageUrl) return [car.imageUrl];
    return [];
  }, [car]);

  const goBack = () => (location.key !== "default" ? navigate(-1) : navigate("/"));

  if (loading && !car) return <DetailsSkeleton />;

  if (notFound || !car) {
    return (
      <main style={{ maxWidth: 1160, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)" }}>Авто не знайдено</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8 }}>Можливо, його прибрали з каталогу.</p>
        <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => navigate("/")}>До каталогу</button>
      </main>
    );
  }

  // Д2: rent only for AVAILABLE; when status is unknown (direct link, no card
  // state) stay optimistic — the rent preview endpoint enforces availability.
  const canRent = car.status ? car.status === "AVAILABLE" : true;
  const city = getCarCity(car);

  const iconStyle = { color: "var(--accent-strong)" };
  // Pre-rendered icon nodes (not component types) — matches the CarCard pattern
  // and keeps the no-unused-vars/jsx lint happy.
  const specs = [
    [<Icons.Cal size={20} style={iconStyle} />, "Рік", car.year ?? "—"],
    [<Icons.Seat size={20} style={iconStyle} />, "Місць", car.seats ?? "—"],
    [<Icons.Fuel size={20} style={iconStyle} />, "Паливо", fuelLabel(car)],
    [<Icons.Gear size={20} style={iconStyle} />, "КПП", transmissionLabel(car)],
  ];
  const tariffs = [
    ["Погодинно", car.pricePerHour, "год"],
    ["Подобово", car.pricePerDay, "доба"],
    ["Помісячно", car.pricePerMonth, "міс"],
  ];

  return (
    <main style={{ maxWidth: 1160, margin: "0 auto", padding: "24px 24px 80px" }}>
      <button onClick={goBack} className="btn btn-subtle" style={{ marginBottom: 18, paddingLeft: 8 }}>
        <Icons.ChevR size={17} style={{ transform: "rotate(180deg)" }} /> До каталогу
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 28, alignItems: "start" }} className="details-grid">
        {/* Left: gallery + info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <div style={{ position: "relative", borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
              <GalleryPhoto src={images[mainIdx]} alt={`${car.brand} ${car.model}`} height={380} />
              {car.status && <div style={{ position: "absolute", top: 14, left: 14 }}><StatusBadge status={car.status} /></div>}
            </div>
            {images.length > 1 && (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(images.length, 5)}, 1fr)`, gap: 10, marginTop: 10 }}>
                {images.slice(0, 5).map((src, i) => (
                  <button key={i} onClick={() => setMainIdx(i)} aria-label={`Фото ${i + 1}`}
                    style={{ border: i === mainIdx ? "2px solid var(--accent)" : "1px solid var(--border)", borderRadius: 11, overflow: "hidden", cursor: "pointer", padding: 0, background: "none" }}>
                    <img src={src} alt="" style={{ aspectRatio: "4/3", width: "100%", objectFit: "cover", display: "block" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {[car.color, car.year].filter(Boolean).join(" · ")}
            </div>
            <h1 style={{ margin: "6px 0 0", fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>{car.brand} {car.model}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14.5, marginTop: 8, flexWrap: "wrap" }}>
              <Icons.Pin size={16} /> {[car.address, city].filter(Boolean).join(", ")}
              {car.registrationNumber && <> · <span className="mono">{car.registrationNumber}</span></>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="specs-grid">
            {specs.map(([icon, label, val]) => (
              <div key={label} className="card" style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 7, boxShadow: "none" }}>
                {icon}
                <div>
                  <div style={{ fontSize: 11.5, color: "var(--text-faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2, color: "var(--text)" }}>{val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* location mini-map */}
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>Розташування</div>
            {hasCoords(car) ? (
              <div style={{ position: "relative", height: 220, borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--border)" }}>
                <MapContainer center={[Number(car.latitude), Number(car.longitude)]} zoom={14} scrollWheelZoom={false}
                  style={{ height: "100%", width: "100%", background: tiles.bg }}>
                  <TileLayer key={theme} attribution={tiles.attribution} url={tiles.url} />
                  <Marker position={[Number(car.latitude), Number(car.longitude)]} icon={detailPin} />
                </MapContainer>
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(120% 100% at 60% 10%, oklch(0.55 0.22 305 / 0.18), transparent 55%)" }} />
              </div>
            ) : (
              <div className="card" style={{ padding: "18px 16px", color: "var(--text-muted)", fontSize: 13.5, boxShadow: "none" }}>
                Координати авто недоступні.
              </div>
            )}
          </div>
        </div>

        {/* Right: pricing / rent */}
        <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 16 }} className="details-aside">
          <div className="card" style={{ padding: 22, boxShadow: "var(--shadow-md)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span className="mono" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--accent-strong)" }}>{money(car.pricePerHour)}</span>
              <span style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 600 }}>грн / година</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 18, borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--border)" }}>
              {tariffs.map(([label, price, unit], i) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "var(--surface)", borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
                  <span className="mono" style={{ fontWeight: 800, fontSize: 16, color: "var(--text)" }}>{money(price)} <span style={{ fontSize: 11.5, color: "var(--text-faint)", fontWeight: 600 }}>/{unit}</span></span>
                </div>
              ))}
            </div>
            {canRent ? (
              <button className="btn btn-primary" style={{ width: "100%", marginTop: 18, padding: "14px", fontSize: 15 }} onClick={() => setRentOpen(true)}>
                Орендувати <Icons.ChevR size={17} sw={2.4} />
              </button>
            ) : (
              <button className="btn" disabled style={{ width: "100%", marginTop: 18, padding: "14px", background: "var(--surface-2)", color: "var(--text-faint)", border: "1px solid var(--border)" }}>Недоступне</button>
            )}
            {admin && (
              <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => setAdminEdit(true)}>
                <Icons.Pencil size={16} /> Редагувати авто
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12.5, color: "var(--text-faint)", justifyContent: "center" }}>
              <Icons.Bolt size={14} fill="currentColor" /> Розблокування за NFC · без застави
            </div>
          </div>
        </div>
      </div>

      {rentOpen && (
        <RentModal
          car={car}
          onClose={() => setRentOpen(false)}
          onSuccess={load}
          onDone={() => { setRentOpen(false); navigate("/rentals"); }}
        />
      )}

      {admin && adminEdit && (
        <CarFormModal
          mode="edit"
          car={car}
          onClose={() => setAdminEdit(false)}
          onSaved={load}
        />
      )}
    </main>
  );
}
