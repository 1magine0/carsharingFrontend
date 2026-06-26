import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthField } from "../components/auth/AuthField";
import { PasswordRequirements } from "../components/auth/PasswordRequirements";
import { isPasswordValid } from "../utils/passwordPolicy";
import { resetPasswordRequest } from "../api/authApi";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [topError, setTopError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!isPasswordValid(pw)) err.pw = true; // checklist is the visible guide
    if (confirm !== pw) err.confirm = "Паролі не співпадають";
    setErrors(err);
    if (Object.keys(err).length) return;

    setSubmitting(true);
    setTopError("");
    try {
      await resetPasswordRequest({ token, newPassword: pw, confirmPassword: confirm });
      setDone(true);
    } catch (ex) {
      const backendMessage =
        ex?.response?.data?.message || "Не вдалося змінити пароль. Спробуйте ще раз";
      setTopError(backendMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Missing token → the link is malformed/old; can't proceed.
  if (!token) {
    return (
      <AuthCard
        title="Недійсне посилання"
        subtitle="Посилання для відновлення паролю некоректне або неповне."
        footer={
          <Link to="/forgot-password" style={{ fontWeight: 700, color: "var(--accent-strong)", textDecoration: "none" }}>
            Запросити нове посилання
          </Link>
        }
      >
        <div style={{ padding: "14px 16px", borderRadius: "var(--r-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>
          Відкрийте посилання повністю з листа або запросіть нове.
        </div>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard
        title="Пароль змінено"
        subtitle="Тепер ви можете увійти з новим паролем."
        footer={
          <Link to="/login" style={{ fontWeight: 700, color: "var(--accent-strong)", textDecoration: "none" }}>
            Перейти до входу
          </Link>
        }
      >
        <div style={{ padding: "14px 16px", borderRadius: "var(--r-sm)", background: "var(--ok-soft)", color: "var(--ok)", fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>
          Ваш пароль успішно оновлено.
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Новий пароль"
      subtitle="Створіть новий пароль для вашого акаунта."
      footer={
        <Link to="/login" style={{ fontWeight: 700, color: "var(--accent-strong)", textDecoration: "none" }}>
          Повернутися до входу
        </Link>
      }
    >
      {topError && (
        <div style={{ marginBottom: 16, padding: "11px 14px", borderRadius: "var(--r-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13.5, fontWeight: 600 }}>
          {topError}
        </div>
      )}
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        <div>
          <AuthField
            label="Новий пароль"
            type="password"
            value={pw}
            onChange={(v) => { setPw(v); setErrors((e) => ({ ...e, pw: undefined })); setTopError(""); }}
            placeholder="••••••••"
            autoFocus
          />
          <PasswordRequirements value={pw} />
        </div>
        <AuthField
          label="Підтвердження пароля"
          type="password"
          value={confirm}
          onChange={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: undefined })); setTopError(""); }}
          placeholder="••••••••"
          error={errors.confirm}
        />
        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 4, width: "100%", padding: "13px", fontSize: 15 }}>
          {submitting ? "Зачекайте…" : "Змінити пароль"}
        </button>
      </form>
    </AuthCard>
  );
}
