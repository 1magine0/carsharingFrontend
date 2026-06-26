import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthField } from "./AuthField";
import { BrandPanel } from "./BrandPanel";
import { PasswordRequirements } from "./PasswordRequirements";
import { isPasswordValid } from "../../utils/passwordPolicy";

const EMPTY = { fullName: "", email: "", phone: "", referralCode: "", password: "", confirmPassword: "" };

/* Shared split-screen auth card. Owns form state + inline validation and
   delegates the actual API call to `onSubmit(values)` (throws on failure). */
export function AuthScreen({ mode, onSubmit }) {
  const isLogin = mode === "login";
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [topError, setTopError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => {
    setF((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setTopError("");
  };

  const validate = () => {
    const err = {};
    if (!f.email.includes("@")) err.email = "Введіть коректний email";
    if (isLogin) {
      if (!f.password) err.password = "Введіть пароль";
    } else {
      // Register: the inline checklist (PasswordRequirements) is the visible guide,
      // so we block submission silently rather than duplicating the rule as a red error.
      if (!isPasswordValid(f.password)) err.password = true;
      if (!f.fullName.trim()) err.fullName = "Вкажіть ім'я та прізвище";
      if (!/^\+?\d[\d\s]{8,}$/.test(f.phone.trim())) err.phone = "Невірний формат телефону";
      if (f.confirmPassword !== f.password) err.confirmPassword = "Паролі не співпадають";
    }
    return err;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length) return;

    setSubmitting(true);
    setTopError("");
    try {
      await onSubmit(f);
    } catch (ex) {
      setTopError(ex?.message || "Сталася помилка. Спробуйте ще раз");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card auth-card" style={{ width: "min(940px, 100%)", overflow: "hidden", boxShadow: "var(--shadow-lg)", borderRadius: "var(--r-xl)", display: "grid", gridTemplateColumns: "1fr 1fr", animation: "popIn .45s cubic-bezier(0.22,1,0.36,1)" }}>
        <div className="auth-brand"><BrandPanel /></div>

        <div style={{ padding: "40px 44px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
              {isLogin ? "З поверненням" : "Створити акаунт"}
            </h1>
            <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: 14.5 }}>
              {isLogin ? "Увійдіть, щоб орендувати авто" : "Кілька кроків — і ви за кермом"}
            </p>
          </div>

          {topError && (
            <div style={{ marginBottom: 16, padding: "11px 14px", borderRadius: "var(--r-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13.5, fontWeight: 600 }}>
              {topError}
            </div>
          )}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {!isLogin && <AuthField label="Ім'я та прізвище" value={f.fullName} onChange={(v) => set("fullName", v)} placeholder="Олександр Ткаченко" error={errors.fullName} autoFocus />}
            <AuthField label="Email" type="email" value={f.email} onChange={(v) => set("email", v)} placeholder="you@email.com" error={errors.email} autoFocus={isLogin} />
            {!isLogin && <AuthField label="Телефон" type="tel" value={f.phone} onChange={(v) => set("phone", v)} placeholder="+380 99 111 22 33" error={errors.phone} />}
            {!isLogin && <AuthField label="Реферальний код" value={f.referralCode} onChange={(v) => set("referralCode", v)} placeholder="Необов'язково" hint="Маєте код запрошення? Ви обидва отримаєте бонуси" />}
            <div>
              <AuthField label="Пароль" type="password" value={f.password} onChange={(v) => set("password", v)} placeholder="••••••••" error={isLogin ? errors.password : undefined} />
              {!isLogin && <PasswordRequirements value={f.password} />}
              {isLogin && (
                <div style={{ marginTop: 8, textAlign: "right" }}>
                  <Link to="/forgot-password" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-strong)", textDecoration: "none" }}>
                    Забули пароль?
                  </Link>
                </div>
              )}
            </div>
            {!isLogin && <AuthField label="Підтвердження пароля" type="password" value={f.confirmPassword} onChange={(v) => set("confirmPassword", v)} placeholder="••••••••" error={errors.confirmPassword} />}

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 4, width: "100%", padding: "13px", fontSize: 15 }}>
              {submitting ? "Зачекайте…" : isLogin ? "Увійти" : "Створити акаунт"}
            </button>
          </form>

          <div style={{ marginTop: 22, textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
            {isLogin ? "Немає акаунту? " : "Вже маєте акаунт? "}
            <Link to={isLogin ? "/register" : "/login"} style={{ fontWeight: 700, color: "var(--accent-strong)", textDecoration: "none" }}>
              {isLogin ? "Зареєструватися" : "Увійти"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;
