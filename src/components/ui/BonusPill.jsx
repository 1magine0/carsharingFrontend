import { Icons } from "./Icons";
import { money } from "./money";

/* BonusPill atom — violet pill showing the user's bonus balance. */
export function BonusPill({ value }) {
  return (
    <div
      title="Баланс бонусів"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 14px 7px 11px",
        borderRadius: "var(--r-pill)",
        background: "var(--accent-soft)",
        color: "var(--accent-strong)",
        border: "1px solid var(--accent)",
        fontWeight: 700,
        fontSize: 14,
      }}
    >
      <Icons.Gift size={17} sw={2} />
      <span className="mono">{money(value)}</span>
      <span style={{ fontWeight: 500, opacity: 0.8, fontSize: 12.5 }}>бонусів</span>
    </div>
  );
}

export default BonusPill;
