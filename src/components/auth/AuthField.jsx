import { useState } from "react";

/* Inline eye / eye-off toggle for password fields (kept local to auth). */
function EyeIcon({ off }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}

/* Labelled input with optional error / hint and a password visibility toggle. */
export function AuthField({ label, type = "text", value, onChange, placeholder, error, hint, autoFocus }) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 7 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input
          className="input"
          type={isPw && show ? "text" : type}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          style={{ height: 46, borderColor: error ? "var(--danger)" : undefined, paddingRight: isPw ? 44 : 14 }}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Сховати пароль" : "Показати пароль"}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "var(--text-faint)", padding: 6, display: "inline-flex" }}
          >
            <EyeIcon off={show} />
          </button>
        )}
      </div>
      {error ? (
        <div style={{ fontSize: 12.5, color: "var(--danger)", marginTop: 6, fontWeight: 600 }}>{error}</div>
      ) : hint ? (
        <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 6 }}>{hint}</div>
      ) : null}
    </label>
  );
}

export default AuthField;
