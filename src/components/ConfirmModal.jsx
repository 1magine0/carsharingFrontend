import { useEffect } from "react";
import { Icons } from "./ui/Icons";

/**
 * Reusable confirmation dialog — drop-in replacement for window.confirm().
 * Controlled via the `show` prop; calls onConfirm / onCancel. Drivo-styled overlay.
 */
export default function ConfirmModal({
    show,
    title = "Підтвердження",
    message,
    confirmText = "Підтвердити",
    cancelText = "Скасувати",
    confirmVariant = "danger",
    onConfirm,
    onCancel,
}) {
    useEffect(() => {
        if (!show) return;

        const handleKey = (e) => {
            if (e.key === "Escape") onCancel();
        };

        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [show, onCancel]);

    if (!show) return null;

    return (
        <div onClick={onCancel} style={{
            position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center", padding: 20,
            background: "color-mix(in oklch, var(--bg) 30%, oklch(0.15 0.02 295 / 0.55))",
            backdropFilter: "blur(8px)", animation: "overlayIn .25s ease",
        }}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="card"
                role="dialog"
                aria-modal="true"
                style={{
                    width: "min(440px, 100%)", padding: 0, overflow: "hidden",
                    boxShadow: "var(--shadow-lg)", borderRadius: "var(--r-lg)", animation: "popIn .3s cubic-bezier(0.22,1,0.36,1)",
                }}
            >
                <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>{title}</h2>
                    <button className="icon-btn" onClick={onCancel} aria-label="Закрити"><Icons.Close size={18} /></button>
                </div>

                {message && (
                    <div style={{ padding: "18px 24px", fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.5 }}>{message}</div>
                )}

                <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button className="btn btn-subtle" onClick={onCancel}>{cancelText}</button>
                    <button className={`btn btn-${confirmVariant}`} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}
