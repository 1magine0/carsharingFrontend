import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
    approveLicenseRequest,
    getPendingLicensesRequest,
    rejectLicenseRequest,
} from "../api/licensesApi";
import { useRealtime } from "../realtime/realtimeContext";
import { Icons } from "../components/ui/Icons";
import { safeHttpUrl } from "../utils/url";

const backendMsg = (error, fallback) =>
    error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

const MONTHS = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"];
const pad2 = (n) => String(n).padStart(2, "0");
function fmtDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/* Spinning refresh control. */
function RefreshButton({ onClick, loading }) {
    return (
        <button className="btn btn-ghost" onClick={onClick} disabled={loading}>
            <Icons.Gear size={16} style={{ animation: loading ? "spin .8s linear infinite" : "none" }} />
            {loading ? "Оновлення…" : "Оновити"}
        </button>
    );
}

/* Reject reason modal — reason is required (shown to the user). */
function RejectModal({ license, submitting, onClose, onConfirm }) {
    const [reason, setReason] = useState("");
    return (
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 20,
            background: "color-mix(in oklch, var(--bg) 30%, oklch(0.15 0.02 295 / 0.55))",
            backdropFilter: "blur(8px)", animation: "overlayIn .25s ease",
        }}>
            <div onClick={(e) => e.stopPropagation()} className="card" style={{
                width: "min(460px, 100%)", padding: 0, overflow: "hidden",
                boxShadow: "var(--shadow-lg)", borderRadius: "var(--r-lg)", animation: "popIn .3s cubic-bezier(0.22,1,0.36,1)",
            }}>
                <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>Відхилити посвідчення</h2>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
                            <span className="mono">{license.documentNumber}</span> · заявка <span className="mono">#{license.id}</span>
                        </div>
                    </div>
                    <button className="icon-btn" onClick={onClose} aria-label="Закрити"><Icons.Close size={18} /></button>
                </div>
                <div style={{ padding: "20px 24px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>Причина відхилення</div>
                    <textarea
                        className="input"
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Напр.: фото нечітке, номер не читається"
                        style={{ resize: "vertical", fontFamily: "inherit" }}
                        autoFocus
                    />
                </div>
                <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button className="btn btn-subtle" onClick={onClose} disabled={submitting}>Скасувати</button>
                    <button className="btn btn-danger" disabled={!reason.trim() || submitting} onClick={() => onConfirm(reason.trim())}>
                        {submitting ? "…" : "Відхилити"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminLicensesPage() {
    const { subscribe } = useRealtime();
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejecting, setRejecting] = useState(null);
    const [actingId, setActingId] = useState(null);
    const [rejectSubmitting, setRejectSubmitting] = useState(false);

    const loadLicenses = async () => {
        setLoading(true);
        try {
            setLicenses(await getPendingLicensesRequest());
        } catch (error) {
            toast.error(backendMsg(error, "Не вдалося завантажити посвідчення"));
        } finally {
            setLoading(false);
        }
    };

    // setState lives inside the async IIFE (react-hooks/set-state-in-effect).
    useEffect(() => {
        void (async () => { await loadLicenses(); })();
    }, []);

    // Keep the latest refetch in a ref so the long-lived subscription always calls
    // the current closure (ref updated in an effect, never during render).
    const refetchRef = useRef(() => {});
    useEffect(() => { refetchRef.current = loadLicenses; });

    // Live moderation queue (/topic/admin/licenses): toast a new submission and
    // refetch on any license event so approve/reject elsewhere updates the grid.
    useEffect(() => {
        const off = subscribe("/topic/admin/licenses", (msg) => {
            if (msg?.type === "SUBMITTED") {
                toast.info(msg.userFullName
                    ? `Нова заявка на водійське: ${msg.userFullName}`
                    : "Нова заявка на водійське");
            }
            void refetchRef.current();
        });
        return off;
    }, [subscribe]);

    const handleApprove = async (id) => {
        setActingId(id);
        try {
            await approveLicenseRequest(id);
            toast.success("Посвідчення підтверджено");
            await loadLicenses();
        } catch (error) {
            toast.error(backendMsg(error, "Не вдалося підтвердити посвідчення"));
        } finally {
            setActingId(null);
        }
    };

    const performReject = async (reason) => {
        setRejectSubmitting(true);
        try {
            await rejectLicenseRequest(rejecting.id, reason);
            toast.success("Посвідчення відхилено");
            setRejecting(null);
            await loadLicenses();
        } catch (error) {
            toast.error(backendMsg(error, "Не вдалося відхилити посвідчення"));
        } finally {
            setRejectSubmitting(false);
        }
    };

    return (
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
                <div style={{ flex: "1 1 360px", minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Адміністрування</div>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>Посвідчення на перевірці</h1>
                    <p style={{ margin: "8px 0 0", color: "var(--text-muted)", fontSize: 15 }}>
                        {loading ? "Завантаження…" : `${licenses.length} ${licenses.length === 1 ? "заявка очікує" : "заявок очікують"} модерації`}
                    </p>
                </div>
                <RefreshButton onClick={loadLicenses} loading={loading} />
            </div>

            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 18 }}>
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skel" style={{ height: 320, borderRadius: "var(--r-lg)" }} />)}
                </div>
            ) : licenses.length === 0 ? (
                <div className="card" style={{ padding: "56px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 17, display: "grid", placeItems: "center", background: "var(--ok-soft)", color: "var(--ok)", marginBottom: 6 }}>
                        <Icons.Check size={30} sw={2.4} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Усе перевірено</h3>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14.5 }}>Немає посвідчень на перевірку.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 18 }}>
                    {licenses.map((l) => {
                        const img = safeHttpUrl(l.imageUrl);
                        const busy = actingId === l.id;
                        return (
                            <div key={l.id} className="card anim-up" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                                {img ? (
                                    <a href={img} target="_blank" rel="noreferrer" style={{ display: "block", height: 168, overflow: "hidden" }}>
                                        <img src={img} alt={`Посвідчення ${l.documentNumber}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                    </a>
                                ) : (
                                    <div className="img-ph" style={{ height: 168 }}><span>скан · {l.documentNumber}</span></div>
                                )}
                                <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div className="mono" style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", wordBreak: "break-word" }}>{l.documentNumber}</div>
                                            <div style={{ fontSize: 12.5, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                                                <Icons.Clock size={13} /> Подано {fmtDateTime(l.createdAt)}
                                            </div>
                                        </div>
                                        <span className="badge badge--reserved" style={{ flexShrink: 0 }}><span className="dot" />На перевірці</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                                        <button className="btn" style={{ flex: 1, background: "var(--ok)", color: "#fff" }} disabled={busy} onClick={() => handleApprove(l.id)}>
                                            <Icons.Check size={16} sw={2.6} /> Підтвердити
                                        </button>
                                        <button className="btn btn-ghost" style={{ flex: 1, color: "var(--danger)" }} disabled={busy} onClick={() => setRejecting(l)}>
                                            Відхилити
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {rejecting && (
                <RejectModal
                    license={rejecting}
                    submitting={rejectSubmitting}
                    onClose={() => setRejecting(null)}
                    onConfirm={performReject}
                />
            )}
        </main>
    );
}
