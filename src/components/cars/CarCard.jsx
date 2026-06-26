import { Icons } from "../ui/Icons";
import { StatusBadge } from "../ui/StatusBadge";
import { money } from "../ui/money";
import { CarPhoto } from "./CarPhoto";
import { fuelLabel, transmissionLabel } from "./carUtils";

/* Small spec chip; `icon` is a pre-rendered node (avoids passing component types). */
function Spec({ icon, children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-muted)", fontSize: 12.5, fontWeight: 500 }}>
      {icon}{children}
    </span>
  );
}

export function CarCard({ car, variant = "photo", onRent, onToggleFav, fav, index = 0, isAdmin, onEdit, onOpen }) {
  // Д2: RESERVED is shown as a badge only — renting is allowed for AVAILABLE only.
  const canRent = car.status === "AVAILABLE";

  const overlayBtnStyle = {
    width: 34, height: 34,
    background: "color-mix(in oklch, var(--surface) 78%, transparent)",
    backdropFilter: "blur(6px)", borderColor: "transparent",
  };

  const favBtn = (
    <button
      onClick={(e) => { e.stopPropagation(); onToggleFav?.(car.id); }}
      className="icon-btn" aria-label="В обране"
      style={{ ...overlayBtnStyle, color: fav ? "var(--danger)" : "var(--text-muted)" }}
    >
      <Icons.Heart size={17} fill={fav ? "currentColor" : "none"} />
    </button>
  );

  const editBtn = isAdmin ? (
    <button
      onClick={(e) => { e.stopPropagation(); onEdit?.(car); }}
      className="icon-btn" aria-label="Редагувати авто" title="Редагувати авто"
      style={overlayBtnStyle}
    >
      <Icons.Pencil size={16} />
    </button>
  ) : null;

  const topRight = <div style={{ display: "flex", gap: 7 }}>{editBtn}{favBtn}</div>;

  const title = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
        {car.brand} <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{car.model}</span>
      </h3>
      <span style={{ fontSize: 12.5, color: "var(--text-faint)", fontWeight: 600 }} className="mono">{car.year}</span>
    </div>
  );

  const addr = (
    <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)", fontSize: 13 }}>
      <Icons.Pin size={14} /> <span>{car.address}</span>
    </div>
  );

  const specs = (
    <>
      <Spec icon={<Icons.Seat size={14} />}>{car.seats} місць</Spec>
      <Spec icon={<Icons.Fuel size={14} />}>{fuelLabel(car)}</Spec>
      <Spec icon={<Icons.Gear size={14} />}>{transmissionLabel(car)}</Spec>
    </>
  );

  const rentBtn = canRent ? (
    <button className="btn btn-primary" style={{ borderRadius: "var(--r-sm)" }} onClick={(e) => { e.stopPropagation(); onRent(car); }}>
      Орендувати <Icons.ChevR size={16} sw={2.4} />
    </button>
  ) : (
    <button className="btn" disabled style={{ background: "var(--surface-2)", color: "var(--text-faint)", border: "1px solid var(--border)" }}>
      Недоступне
    </button>
  );

  const clickable = onOpen ? { onClick: () => onOpen(car), style: { cursor: "pointer" } } : {};

  /* ---------- COMPACT (list row) ---------- */
  if (variant === "compact") {
    return (
      <article className="card card-hover anim-up" {...clickable} style={{ display: "flex", gap: 16, padding: 14, animationDelay: `${index * 40}ms`, alignItems: "center", ...clickable.style }}>
        <div style={{ position: "relative", width: 132, flexShrink: 0 }}>
          <CarPhoto car={car} height={92} rounded="12px" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            {title}<div style={{ marginLeft: "auto" }}><StatusBadge status={car.status} size="sm" /></div>
          </div>
          {addr}
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 14 }}>{specs}</div>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>
            {money(car.pricePerHour)}<span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}> грн/год</span>
          </div>
          {rentBtn}
        </div>
      </article>
    );
  }

  /* ---------- PHOTO (default grid card) ---------- */
  return (
    <article className="card card-hover anim-up" {...clickable} style={{ overflow: "hidden", display: "flex", flexDirection: "column", animationDelay: `${index * 40}ms`, ...clickable.style }}>
      <div style={{ position: "relative" }}>
        <CarPhoto car={car} height={172} />
        <div style={{ position: "absolute", top: 12, left: 12 }}><StatusBadge status={car.status} /></div>
        <div style={{ position: "absolute", top: 12, right: 12 }}>{topRight}</div>
      </div>
      <div style={{ padding: "15px 17px 17px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        <div>
          {title}
          <div style={{ marginTop: 6 }}>{addr}</div>
        </div>
        <div style={{ display: "flex", gap: 14, paddingBottom: 2 }}>{specs}</div>
        <div style={{ height: 1, background: "var(--border)" }} />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span className="mono" style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>{money(car.pricePerHour)}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>грн/год</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 1 }}>
              <span className="mono">{money(car.pricePerDay)}</span>/доба · <span className="mono">{money(car.pricePerMonth)}</span>/міс
            </div>
          </div>
          {rentBtn}
        </div>
      </div>
    </article>
  );
}

export function CarCardSkeleton() {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="skel" style={{ height: 172, borderRadius: 0 }} />
      <div style={{ padding: "15px 17px 17px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="skel" style={{ height: 18, width: "65%" }} />
        <div className="skel" style={{ height: 13, width: "85%" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <div className="skel" style={{ height: 12, width: 54 }} />
          <div className="skel" style={{ height: 12, width: 54 }} />
          <div className="skel" style={{ height: 12, width: 54 }} />
        </div>
        <div style={{ height: 1, background: "var(--border)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="skel" style={{ height: 26, width: 96 }} />
          <div className="skel" style={{ height: 38, width: 120, borderRadius: 11 }} />
        </div>
      </div>
    </div>
  );
}

export default CarCard;
