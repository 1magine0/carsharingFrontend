import { BrandPanel } from "./BrandPanel";

/* Split-screen auth card shell (BrandPanel + content column), matching AuthScreen.
   Used by the standalone forgot/reset password pages so they share the exact look
   without duplicating the layout markup. */
export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div
        className="card auth-card"
        style={{
          width: "min(940px, 100%)", overflow: "hidden", boxShadow: "var(--shadow-lg)",
          borderRadius: "var(--r-xl)", display: "grid", gridTemplateColumns: "1fr 1fr",
          animation: "popIn .45s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div className="auth-brand"><BrandPanel /></div>

        <div style={{ padding: "40px 44px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: 14.5 }}>{subtitle}</p>
            )}
          </div>

          {children}

          {footer && (
            <div style={{ marginTop: 22, textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthCard;
