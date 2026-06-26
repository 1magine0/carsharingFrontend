import { Icons } from "../ui/Icons";

/* Search input + Filters button (with active-count badge). */
export function SearchBar({ value, onChange, onOpenFilters, activeFilterCount }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
        <Icons.Search size={19} style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
        <input
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Пошук за брендом, моделлю, номером, адресою…"
          style={{ paddingLeft: 44, height: 48, fontSize: 14.5 }}
        />
      </div>
      <button className="btn btn-ghost" style={{ height: 48, padding: "0 18px", position: "relative" }} onClick={onOpenFilters}>
        <Icons.Sliders size={18} /> Фільтри
        {activeFilterCount > 0 && (
          <span className="mono" style={{ marginLeft: 4, minWidth: 20, height: 20, padding: "0 6px", borderRadius: 99, background: "var(--accent)", color: "var(--accent-contrast)", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center" }}>
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}

const VIEW_OPTIONS = [
  { id: "cards", label: "Картки", icon: <Icons.Grid size={16} /> },
  { id: "map", label: "Карта", icon: <Icons.Map size={16} /> },
];

/* Cards / Map segmented toggle. */
export function ViewToggle({ view, onChange }) {
  return (
    <div style={{ display: "inline-flex", padding: 4, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", gap: 3 }}>
      {VIEW_OPTIONS.map((o) => {
        const active = view === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 15px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", transition: "all .15s ease",
            background: active ? "var(--surface)" : "transparent",
            color: active ? "var(--text)" : "var(--text-muted)",
            boxShadow: active ? "var(--shadow-sm)" : "none",
          }}>
            {o.icon}{o.label}
          </button>
        );
      })}
    </div>
  );
}

/* Active filter chips. `chips`: [{ key, label, onRemove }]. */
export function ActiveChips({ chips, onClearAll }) {
  if (!chips.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      {chips.map((c) => (
        <button key={c.key} className="chip" data-active="true" onClick={c.onRemove} style={{ paddingRight: 8 }}>
          {c.label}<Icons.Close size={13} sw={2.5} style={{ opacity: 0.7 }} />
        </button>
      ))}
      <button
        onClick={onClearAll}
        style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", padding: "6px 8px" }}
      >
        Очистити все
      </button>
    </div>
  );
}

/* Empty result state. */
export function EmptyState({ onReset }) {
  return (
    <div className="card" style={{ padding: "64px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, gridColumn: "1 / -1" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, display: "grid", placeItems: "center", background: "var(--surface-2)", color: "var(--text-faint)", marginBottom: 8 }}>
        <Icons.Car size={32} />
      </div>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Нічого не знайдено</h3>
      <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: 14.5, maxWidth: 320 }}>
        Спробуйте змінити пошуковий запит або скинути фільтри.
      </p>
      <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={onReset}>Скинути фільтри</button>
    </div>
  );
}
