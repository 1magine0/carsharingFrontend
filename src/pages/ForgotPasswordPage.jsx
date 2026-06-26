import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthField } from "../components/auth/AuthField";
import { forgotPasswordRequest } from "../api/authApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Введіть коректний email");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await forgotPasswordRequest(email.trim());
      // Backend returns a generic success regardless of whether the email exists.
      setSent(true);
    } catch {
      // A thrown error means a network/server failure, not "email not found".
      setError("Не вдалося надіслати лист. Спробуйте пізніше");
    } finally {
      setSubmitting(false);
    }
  };

  const backToLogin = (
    <>
      Згадали пароль?{" "}
      <Link to="/login" style={{ fontWeight: 700, color: "var(--accent-strong)", textDecoration: "none" }}>
        Увійти
      </Link>
    </>
  );

  if (sent) {
    return (
      <AuthCard
        title="Перевірте пошту"
        subtitle="Якщо акаунт із таким email існує, ми надіслали лист із посиланням для відновлення паролю."
        footer={backToLogin}
      >
        <div style={{ padding: "14px 16px", borderRadius: "var(--r-sm)", background: "var(--ok-soft)", color: "var(--ok)", fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>
          Лист надіслано на <strong>{email.trim()}</strong>. Посилання дійсне обмежений час.
          Не бачите листа — перевірте теку «Спам».
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => { setSent(false); setEmail(""); }}
          style={{ marginTop: 16, width: "100%", padding: "12px", fontSize: 14.5 }}
        >
          Надіслати ще раз
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Відновлення паролю"
      subtitle="Введіть email акаунта — ми надішлемо посилання для створення нового паролю."
      footer={backToLogin}
    >
      {error && (
        <div style={{ marginBottom: 16, padding: "11px 14px", borderRadius: "var(--r-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13.5, fontWeight: 600 }}>
          {error}
        </div>
      )}
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={(v) => { setEmail(v); setError(""); }}
          placeholder="you@email.com"
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 4, width: "100%", padding: "13px", fontSize: 15 }}>
          {submitting ? "Зачекайте…" : "Надіслати посилання"}
        </button>
      </form>
    </AuthCard>
  );
}
