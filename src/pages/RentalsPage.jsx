import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    getMyRentalsRequest,
    getMyActiveRentalRequest,
    finishRentalRequest,
    unlockRentalCarRequest,
} from "../api/rentalsApi";
import { getRentalPhotosRequest } from "../api/rentalPhotosApi";
import {
    createMockPaymentRequest,
    mockPayRequest,
    createLiqPayPaymentRequest,
} from "../api/paymentsApi";
import RentalPhotosModal from "../components/RentalPhotosModal";
import { notifyBalanceChanged } from "../utils/balanceEvents";
import { Icons } from "../components/ui/Icons";
import { money } from "../components/ui/money";
import { StatusBadge } from "../components/ui/StatusBadge";
import { RENTAL_STATUS_META, TARIFF_LABEL } from "../constants/labels";

const MONTHS = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"];
const pad2 = (n) => String(n).padStart(2, "0");
function fmtDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const LIQPAY_URL_PREFIX = "https://www.liqpay.ua/";

/* Defence against a compromised/misconfigured backend returning an arbitrary POST
   target: only allow the canonical LiqPay checkout origin (Fix 7 hardening). */
const submitLiqPayForm = ({ checkoutUrl, data, signature }) => {
    if (typeof checkoutUrl !== "string" || !checkoutUrl.startsWith(LIQPAY_URL_PREFIX)) {
        throw new Error("Невалідний LiqPay checkout URL");
    }
    const form = document.createElement("form");
    form.method = "POST";
    form.action = checkoutUrl;
    form.acceptCharset = "utf-8";
    const dataInput = document.createElement("input");
    dataInput.type = "hidden";
    dataInput.name = "data";
    dataInput.value = data;
    const signatureInput = document.createElement("input");
    signatureInput.type = "hidden";
    signatureInput.name = "signature";
    signatureInput.value = signature;
    form.appendChild(dataInput);
    form.appendChild(signatureInput);
    document.body.appendChild(form);
    try {
        form.submit();
    } finally {
        form.remove();
    }
};

const backendMsg = (error, fallback) =>
    error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

/* Numbered progress stepper for the active-rental flow. */
function Stepper({ steps, current }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {steps.map((s, i) => {
                const state = s.done ? "done" : i === current ? "active" : "todo";
                const bg = state === "done" ? "var(--ok)" : state === "active" ? "var(--accent)" : "var(--surface-2)";
                const fg = state === "todo" ? "var(--text-faint)" : "var(--accent-contrast)";
                const labelColor = state === "todo" ? "var(--text-faint)" : "var(--text)";
                return (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "0 0 auto" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 99, display: "grid", placeItems: "center", background: bg, color: fg, fontWeight: 800, fontSize: 13, border: state === "todo" ? "1px solid var(--border)" : "none" }}>
                                {s.done ? <Icons.Check size={16} sw={2.6} /> : i + 1}
                            </div>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: labelColor, whiteSpace: "nowrap" }}>{s.label}</div>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{ flex: 1, height: 2, margin: "0 8px", marginBottom: 22, background: s.done ? "var(--ok)" : "var(--border)", borderRadius: 2 }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* One action tile inside the active-rental card (photo / unlock / finish). */
function ActionTile({ icon, title, hint, count, done, disabled, onClick, danger }) {
    return (
        <button onClick={onClick} disabled={disabled} style={{
            textAlign: "left", padding: "14px 16px", borderRadius: "var(--r-md)", width: "100%",
            border: `1.5px solid ${done ? "var(--ok)" : disabled ? "var(--border)" : danger ? "var(--danger)" : "var(--accent)"}`,
            background: disabled ? "var(--surface-2)" : done ? "var(--ok-soft)" : "var(--surface)",
            cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.7 : 1,
            display: "flex", alignItems: "center", gap: 12, transition: "all .15s ease",
        }}>
            <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: "var(--r-sm)", display: "grid", placeItems: "center", background: done ? "var(--ok)" : danger ? "var(--danger)" : "var(--accent)", color: "var(--accent-contrast)" }}>
                {done ? <Icons.Check size={20} sw={2.6} /> : icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--text)" }}>{title}{count != null && <span className="mono" style={{ marginLeft: 6, fontSize: 12.5, color: "var(--text-muted)" }}>{count}</span>}</div>
                {hint && <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{hint}</div>}
            </div>
            {!disabled && <Icons.ChevR size={16} style={{ color: "var(--text-faint)" }} />}
        </button>
    );
}

export default function RentalsPage() {
    const [rentals, setRentals] = useState([]);
    const [activeRental, setActiveRental] = useState(null);
    const [activePhotos, setActivePhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [photosModal, setPhotosModal] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [unlockLoading, setUnlockLoading] = useState(false);
    const [unlocked, setUnlocked] = useState(false);
    const [finishing, setFinishing] = useState(false);

    const loadActivePhotos = async (rentalId) => {
        if (!rentalId) { setActivePhotos([]); return; }
        try {
            setActivePhotos(await getRentalPhotosRequest(rentalId));
        } catch {
            setActivePhotos([]);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            setRentals(await getMyRentalsRequest());
            try {
                const active = await getMyActiveRentalRequest();
                setActiveRental(active);
                await loadActivePhotos(active?.id);
            } catch {
                setActiveRental(null);
                setActivePhotos([]);
            }
        } catch {
            toast.error("Не вдалося завантажити оренди");
        } finally {
            setLoading(false);
        }
    };

    // Async init wrapped in an IIFE so no setState runs synchronously in the
    // effect body (react-hooks/set-state-in-effect).
    useEffect(() => {
        void (async () => { await loadData(); })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMockPayment = async (rentalId) => {
        setPaymentLoading(true);
        try {
            const payment = await createMockPaymentRequest(rentalId);
            await mockPayRequest(payment.id);
            toast.success("Оплату виконано успішно");
            await loadData();
        } catch (error) {
            toast.error(backendMsg(error, "Не вдалося виконати оплату"));
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleLiqPayPayment = async (rentalId) => {
        setPaymentLoading(true);
        try {
            const checkout = await createLiqPayPaymentRequest(rentalId);
            if (checkout.mockMode) {
                // Backend without a public LiqPay callback (dev, no ngrok): finalise
                // via the mock-success endpoint — same Payment record, no round-trip.
                await mockPayRequest(checkout.paymentId);
                toast.success("Mock-оплата (dev-режим) успішна");
                await loadData();
                setPaymentLoading(false);
                return;
            }
            submitLiqPayForm(checkout);
        } catch (error) {
            toast.error(backendMsg(error, "Не вдалося створити LiqPay платіж"));
            setPaymentLoading(false);
        }
    };

    const handleUnlock = async (rentalId) => {
        setUnlockLoading(true);
        try {
            const res = await unlockRentalCarRequest(rentalId);
            setUnlocked(true);
            toast.success(res?.message || "Авто розблоковано");
        } catch (error) {
            toast.error(backendMsg(error, "Не вдалося розблокувати авто"));
        } finally {
            setUnlockLoading(false);
        }
    };

    const handleFinish = async (rentalId) => {
        setFinishing(true);
        try {
            await finishRentalRequest(rentalId);
            toast.success("Оренду завершено успішно");
            setUnlocked(false);
            // Finish earns +1% bonus (DB trigger) — refresh the navbar pill.
            notifyBalanceChanged();
            await loadData();
        } catch (error) {
            toast.error(backendMsg(error, "Не вдалося завершити оренду"));
        } finally {
            setFinishing(false);
        }
    };

    const beforePhotos = activePhotos.filter((p) => p.photoType === "BEFORE");
    const afterPhotos = activePhotos.filter((p) => p.photoType === "AFTER");
    const hasBefore = beforePhotos.length > 0;
    const hasAfter = afterPhotos.length > 0;

    const booked = rentals.filter((r) => r.status === "BOOKED");
    const history = rentals.filter((r) => r.status !== "BOOKED");

    const steps = [
        { label: "Фото «до»", done: hasBefore },
        { label: "Розблокувати", done: unlocked },
        { label: "Фото «після»", done: hasAfter },
        { label: "Завершити", done: false },
    ];
    const currentStep = steps.findIndex((s) => !s.done);

    if (loading) {
        return (
            <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 80px" }}>
                <div className="skel" style={{ height: 34, width: 200, marginBottom: 22 }} />
                <div className="skel" style={{ height: 280, borderRadius: "var(--r-lg)", marginBottom: 24 }} />
                <div className="skel" style={{ height: 180, borderRadius: "var(--r-lg)" }} />
            </main>
        );
    }

    return (
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 80px" }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>Мої оренди</h1>
            <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontSize: 14.5 }}>Керуйте активною орендою, оплатою та переглядайте історію поїздок.</p>

            {/* ---- Active rental hero ---- */}
            <section style={{ marginBottom: 28 }}>
                {activeRental ? (
                    <div className="card" style={{ padding: 0, overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
                        <div style={{ padding: "22px 24px", borderBottom: "1px solid var(--border)", background: "radial-gradient(120% 140% at 90% 0%, var(--accent-soft), transparent 55%)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                        <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--ok)", animation: "pulse 1.8s ease-in-out infinite" }} />
                                        Активна оренда
                                    </div>
                                    <h2 style={{ margin: "8px 0 6px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
                                        {activeRental.carBrand} {activeRental.carModel}
                                    </h2>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13.5, flexWrap: "wrap" }}>
                                        <span className="mono">{activeRental.carRegistrationNumber}</span>
                                        <span>·</span>
                                        <span>{TARIFF_LABEL[activeRental.tariffType] || activeRental.tariffType}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <StatusBadge status={activeRental.status} map={RENTAL_STATUS_META} />
                                    <div className="mono" style={{ marginTop: 10, fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--accent-strong)" }}>
                                        {money(activeRental.totalPrice)} <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 600 }}>грн</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 22, marginTop: 16, flexWrap: "wrap", fontSize: 13.5 }}>
                                <div><span style={{ color: "var(--text-faint)" }}>Початок: </span><span style={{ color: "var(--text)", fontWeight: 600 }}>{fmtDateTime(activeRental.startTime)}</span></div>
                                <div><span style={{ color: "var(--text-faint)" }}>Завершення: </span><span style={{ color: "var(--text)", fontWeight: 600 }}>{fmtDateTime(activeRental.endTime)}</span></div>
                            </div>
                        </div>

                        <div style={{ padding: "22px 24px" }}>
                            <div style={{ marginBottom: 22 }}><Stepper steps={steps} current={currentStep} /></div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="rentals-actions">
                                <ActionTile
                                    icon={<Icons.Cal size={20} />}
                                    title="Фото «до»"
                                    count={`${beforePhotos.length}/6`}
                                    hint={hasBefore ? "Фото завантажено" : "Потрібно перед стартом"}
                                    done={hasBefore}
                                    onClick={() => setPhotosModal({ rentalId: activeRental.id, photoType: "BEFORE" })}
                                />
                                <ActionTile
                                    icon={<Icons.Bolt size={20} fill="currentColor" />}
                                    title={unlockLoading ? "Сканування NFC…" : "Розблокувати"}
                                    hint={hasBefore ? "Прикладіть телефон до авто" : "Спершу фото «до»"}
                                    done={unlocked}
                                    disabled={!hasBefore || unlockLoading}
                                    onClick={() => handleUnlock(activeRental.id)}
                                />
                                <ActionTile
                                    icon={<Icons.Cal size={20} />}
                                    title="Фото «після»"
                                    count={`${afterPhotos.length}/6`}
                                    hint={hasBefore ? "Перед завершенням" : "Спершу фото «до»"}
                                    done={hasAfter}
                                    disabled={!hasBefore}
                                    onClick={() => setPhotosModal({ rentalId: activeRental.id, photoType: "AFTER" })}
                                />
                                <ActionTile
                                    icon={<Icons.Check size={20} sw={2.4} />}
                                    title={finishing ? "Завершення…" : "Завершити оренду"}
                                    hint={hasAfter ? "Бонус +1% після завершення" : "Спершу фото «після»"}
                                    danger
                                    disabled={!hasAfter || finishing}
                                    onClick={() => handleFinish(activeRental.id)}
                                />
                            </div>

                            {!hasBefore && (
                                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", borderRadius: "var(--r-sm)", background: "var(--warn-soft)", color: "var(--warn)", fontSize: 13, fontWeight: 600 }}>
                                    <Icons.Bell size={16} /> Завантажте хоча б одне фото «до», щоб розблокувати авто.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ padding: "40px 24px", textAlign: "center", boxShadow: "none" }}>
                        <div style={{ width: 56, height: 56, borderRadius: 99, margin: "0 auto 14px", display: "grid", placeItems: "center", background: "var(--surface-2)", color: "var(--text-faint)" }}>
                            <Icons.Car size={28} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>Активної оренди немає</div>
                        <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: 14 }}>Оберіть авто в каталозі, щоб почати поїздку.</p>
                    </div>
                )}
            </section>

            {/* ---- Payment required ---- */}
            {booked.length > 0 && (
                <section style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--text)" }}>Потрібна оплата</h2>
                        <span className="badge badge--reserved" style={{ fontSize: 11, padding: "3px 8px" }}><span className="dot" />{booked.length}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {booked.map((r) => (
                            <div key={r.id} className="card" style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", boxShadow: "none", borderColor: "var(--warn)" }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 15.5, color: "var(--text)" }}>{r.carBrand} {r.carModel}</div>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 3, flexWrap: "wrap" }}>
                                        <span className="mono">{r.carRegistrationNumber}</span>
                                        <span>·</span>
                                        <span>{TARIFF_LABEL[r.tariffType] || r.tariffType}</span>
                                        <span>·</span>
                                        <span>{fmtDateTime(r.startTime)} → {fmtDateTime(r.endTime)}</span>
                                    </div>
                                    {Number(r.bonusUsed) > 0 && (
                                        <div style={{ fontSize: 12.5, color: "var(--accent-strong)", marginTop: 4 }}>Списано бонусів: <span className="mono">{money(r.bonusUsed)}</span></div>
                                    )}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                    <div className="mono" style={{ fontSize: 19, fontWeight: 800, color: "var(--text)" }}>{money(r.totalPrice)} <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600 }}>грн</span></div>
                                    <button className="btn btn-subtle" onClick={() => handleMockPayment(r.id)} disabled={paymentLoading}>Mock-оплата</button>
                                    <button className="btn btn-primary" onClick={() => handleLiqPayPayment(r.id)} disabled={paymentLoading}>
                                        {paymentLoading ? "…" : "Оплатити LiqPay"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ---- History ---- */}
            <section>
                <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800, color: "var(--text)" }}>Історія оренд</h2>
                {history.length === 0 ? (
                    <div className="card" style={{ padding: "28px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14, boxShadow: "none" }}>
                        Завершених оренд поки немає.
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0, overflow: "hidden", boxShadow: "none" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                                <thead>
                                    <tr style={{ background: "var(--surface-2)", textAlign: "left", color: "var(--text-muted)" }}>
                                        <th style={{ padding: "11px 16px", fontWeight: 600 }}>Авто</th>
                                        <th style={{ padding: "11px 16px", fontWeight: 600 }}>Тариф</th>
                                        <th style={{ padding: "11px 16px", fontWeight: 600 }}>Період</th>
                                        <th style={{ padding: "11px 16px", fontWeight: 600, textAlign: "right" }}>Сума</th>
                                        <th style={{ padding: "11px 16px", fontWeight: 600 }}>Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((r) => (
                                        <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ fontWeight: 700, color: "var(--text)" }}>{r.carBrand} {r.carModel}</div>
                                                <div className="mono" style={{ fontSize: 12, color: "var(--text-faint)" }}>{r.carRegistrationNumber}</div>
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{TARIFF_LABEL[r.tariffType] || r.tariffType}</td>
                                            <td style={{ padding: "12px 16px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDateTime(r.startTime)} → {fmtDateTime(r.endTime)}</td>
                                            <td style={{ padding: "12px 16px", textAlign: "right" }} className="mono"><b style={{ color: "var(--text)" }}>{money(r.totalPrice)}</b> грн</td>
                                            <td style={{ padding: "12px 16px" }}><StatusBadge status={r.status} map={RENTAL_STATUS_META} size="sm" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {photosModal && (
                <RentalPhotosModal
                    rentalId={photosModal.rentalId}
                    photoType={photosModal.photoType}
                    onClose={() => setPhotosModal(null)}
                    onChanged={async () => { await loadActivePhotos(photosModal.rentalId); }}
                />
            )}
        </main>
    );
}
