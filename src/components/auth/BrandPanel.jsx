import { Icons } from "../ui/Icons";

const POINTS = [
  ["Bolt", "Розблокування за NFC", "Беріть авто без ключа — просто прикладіть телефон"],
  ["Gift", "Бонуси за кожну поїздку", "І за друзів, які приєднаються за вашим кодом"],
  ["Pin", "Авто поруч 24/7", "Десятки машин у Харкові та Києві на мапі"],
];

/* Left promo panel of the auth split-screen (hidden ≤760px via .auth-brand). */
export function BrandPanel() {
  return (
    <div style={{
      position: "relative", overflow: "hidden", padding: "48px 44px",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      background: "linear-gradient(155deg, var(--accent-strong), oklch(0.4 0.2 295))",
      color: "#fff",
    }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none",
        background: "radial-gradient(60% 50% at 85% 10%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(50% 40% at 10% 95%, rgba(0,0,0,0.25), transparent 60%)",
      }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.16)", backdropFilter: "blur(4px)" }}>
          <Icons.Bolt size={22} sw={2.2} fill="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em" }}>Drivo</span>
      </div>

      <div style={{ position: "relative" }}>
        <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, textWrap: "balance" }}>
          Орендуй авто<br />за одну хвилину
        </h2>
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 18 }}>
          {POINTS.map(([ic, t, d]) => {
            const I = Icons[ic];
            return (
              <div key={t} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.14)" }}>
                  <I size={19} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{t}</div>
                  <div style={{ fontSize: 13.5, opacity: 0.85, marginTop: 1 }}>{d}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: "relative", fontSize: 13, opacity: 0.8 }}>© 2026 Drivo · Каршеринг в Україні</div>
    </div>
  );
}

export default BrandPanel;
