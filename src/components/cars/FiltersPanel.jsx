import { Icons } from "../ui/Icons";
import { money } from "../ui/money";
import { STATUS_META, FUEL_LABEL, TARIFF_LABEL } from "../../constants/labels";

const STATUSES = ["AVAILABLE", "RESERVED", "RENTED", "SERVICE", "INACTIVE"];
const TARIFFS = ["HOUR", "DAY", "MONTH"];

/* Chip group over [{ value, label }] options; `selected` holds values. */
function ChipGroup({ options, selected, onToggle }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button key={o.value} className="chip" data-active={on || undefined} onClick={() => onToggle(o.value)}>
            {on && <Icons.Check size={13} sw={3} />}{o.label}
          </button>
        );
      })}
    </div>
  );
}

/* Dual-thumb range. `value` = [lo, hi]. */
function DualRange({ min, max, step = 1, value, onChange, fmt = (v) => v }) {
  const [lo, hi] = value;
  const safeMax = max > min ? max : min + step;
  const pct = (v) => ((v - min) / (safeMax - min)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span className="mono" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{fmt(lo)}</span>
        <span className="mono" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{fmt(hi)}</span>
      </div>
      <div style={{ position: "relative", height: 28 }}>
        <div style={{ position: "absolute", top: 11, left: 0, right: 0, height: 5, borderRadius: 99, background: "var(--surface-2)", border: "1px solid var(--border)" }} />
        <div style={{ position: "absolute", top: 11, height: 5, borderRadius: 99, background: "var(--accent)", left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" min={min} max={safeMax} step={step} value={lo} className="dual-thumb"
          onChange={(e) => onChange([Math.min(+e.target.value, hi - step), hi])} />
        <input type="range" min={min} max={safeMax} step={step} value={hi} className="dual-thumb"
          onChange={(e) => onChange([lo, Math.max(+e.target.value, lo + step)])} />
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ padding: "20px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 13 }}>{title}</div>
      {children}
    </div>
  );
}

/* Slide-in filters sheet. */
export function FiltersPanel({ open, onClose, filters, setFilters, options, resultCount, onReset, onTariffChange }) {
  if (!open) return null;

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const toggle = (k, v) => setFilters((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));

  const statusOptions = STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }));
  const fuelOptions = options.fuels.map((code) => ({ value: code, label: FUEL_LABEL[code] || code }));
  const brandOptions = options.brands.map((b) => ({ value: b, label: b }));
  const cityOptions = options.cities.map((c) => ({ value: c, label: c }));

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 55, background: "oklch(0.15 0.02 295 / 0.45)", backdropFilter: "blur(4px)", animation: "overlayIn .25s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: "min(440px, 100%)",
        background: "var(--bg)", borderLeft: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
        display: "flex", flexDirection: "column", animation: "sheetIn .35s cubic-bezier(0.22,1,0.36,1)",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icons.Sliders size={20} style={{ color: "var(--accent-strong)" }} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>Фільтри</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Закрити"><Icons.Close size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
          <Section title="Статус">
            <ChipGroup options={statusOptions} selected={filters.status} onToggle={(v) => toggle("status", v)} />
          </Section>
          <Section title="Тариф для ціни">
            <div style={{ display: "flex", gap: 8 }}>
              {TARIFFS.map((id) => (
                <button key={id} className="chip" data-active={filters.tariff === id || undefined} style={{ flex: 1, justifyContent: "center" }} onClick={() => onTariffChange(id)}>
                  {TARIFF_LABEL[id]}
                </button>
              ))}
            </div>
          </Section>
          {brandOptions.length > 0 && (
            <Section title="Бренд">
              <ChipGroup options={brandOptions} selected={filters.brands} onToggle={(v) => toggle("brands", v)} />
            </Section>
          )}
          {cityOptions.length > 0 && (
            <Section title="Місто">
              <ChipGroup options={cityOptions} selected={filters.cities} onToggle={(v) => toggle("cities", v)} />
            </Section>
          )}
          {fuelOptions.length > 0 && (
            <Section title="Тип пального">
              <ChipGroup options={fuelOptions} selected={filters.fuels} onToggle={(v) => toggle("fuels", v)} />
            </Section>
          )}
          <Section title="Рік випуску">
            <DualRange min={options.yearBounds.min} max={options.yearBounds.max} value={filters.year} onChange={(v) => set("year", v)} />
          </Section>
          <Section title={`Ціна, грн/${filters.tariff === "DAY" ? "доба" : filters.tariff === "MONTH" ? "міс" : "год"}`}>
            <DualRange min={options.priceBounds.min} max={options.priceBounds.max} step={10} value={filters.price} onChange={(v) => set("price", v)} fmt={(v) => `${money(v)} грн`} />
          </Section>
          <div style={{ height: 8 }} />
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 12 }}>
          <button className="btn btn-ghost" onClick={onReset}>Скинути</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
            Показати {resultCount} авто
          </button>
        </div>
      </div>
    </div>
  );
}

export default FiltersPanel;
