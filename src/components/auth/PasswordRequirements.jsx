import { PASSWORD_RULES } from "../../utils/passwordPolicy";

/* Live password-policy checklist. Each rule renders faint grey while unmet and
   turns green (--ok) the moment its predicate passes. Shared by the register and
   reset-password screens. Rules live in utils/passwordPolicy.js (single source of
   truth, mirrors the backend: min 8 chars + at least one digit). */

function RuleIcon({ done }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={done ? 2.6 : 1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {done ? <path d="M20 6 9 17l-5-5" /> : <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

export function PasswordRequirements({ value }) {
  const v = value ?? "";
  return (
    <ul style={{ listStyle: "none", margin: "9px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
      {PASSWORD_RULES.map((rule) => {
        const done = rule.test(v);
        return (
          <li
            key={rule.id}
            style={{
              display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600,
              color: done ? "var(--ok)" : "var(--text-faint)", transition: "color .2s ease",
            }}
          >
            <RuleIcon done={done} />
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

export default PasswordRequirements;
