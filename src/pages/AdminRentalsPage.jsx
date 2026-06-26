import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
    getAdminActiveRentalsRequest,
    getAdminRentalsRequest,
} from "../api/adminRentalsApi";
import { useRealtime } from "../realtime/realtimeContext";
import AdminRentalPhotosModal from "../components/AdminRentalPhotosModal";
import { Icons } from "../components/ui/Icons";
import { money } from "../components/ui/money";
import { StatusBadge } from "../components/ui/StatusBadge";
import { RENTAL_STATUS_META, TARIFF_LABEL } from "../constants/labels";

const PAGE_SIZE = 5;

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

function RefreshButton({ onClick, loading }) {
    return (
        <button className="btn btn-ghost" onClick={onClick} disabled={loading}>
            <Icons.Gear size={16} style={{ animation: loading ? "spin .8s linear infinite" : "none" }} />
            {loading ? "Оновлення…" : "Оновити"}
        </button>
    );
}

/* Before/after photo count chip — disabled when there are no photos. */
function PhotoBtn({ count, label, onClick }) {
    const empty = !count;
    return (
        <button className="chip" onClick={onClick} disabled={empty} style={{ opacity: empty ? 0.5 : 1, cursor: empty ? "default" : "pointer" }}>
            {label} <b className="mono" style={{ color: count > 0 ? "var(--accent-strong)" : "var(--text-faint)" }}>{count ?? 0}</b>
        </button>
    );
}

const TH = ({ children, right }) => (
    <th style={{ padding: "12px 14px", fontWeight: 700, fontSize: 11.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap", textAlign: right ? "right" : "left" }}>{children}</th>
);

export default function AdminRentalsPage() {
    const { subscribe } = useRealtime();
    const [rentals, setRentals] = useState([]);
    const [tab, setTab] = useState("active");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [photo, setPhoto] = useState(null);

    const loadRentals = async (selectedTab = tab) => {
        setLoading(true);
        try {
            const data = selectedTab === "active"
                ? await getAdminActiveRentalsRequest()
                : await getAdminRentalsRequest();
            setRentals(data);
        } catch (error) {
            toast.error(backendMsg(error, "Не вдалося завантажити оренди"));
            setRentals([]);
        } finally {
            setLoading(false);
        }
    };

    // setState lives inside the async IIFE (react-hooks/set-state-in-effect).
    useEffect(() => {
        void (async () => { await loadRentals("active"); })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Tab change resets pagination in the handler (not an effect) so we never
    // call setState synchronously inside an effect body.
    const changeTab = async (next) => {
        if (next === tab) return;
        setTab(next);
        setPage(1);
        await loadRentals(next);
    };

    const refresh = async () => { setPage(1); await loadRentals(tab); };

    // Keep a current-tab refetch in a ref so the long-lived subscription refetches
    // whichever tab is active (ref updated in an effect, never during render).
    const refetchRef = useRef(() => {});
    useEffect(() => { refetchRef.current = () => loadRentals(tab); });

    // Live rentals dashboard (/topic/admin/rentals): toast notable transitions and
    // refetch the active tab so the table stays current without manual refresh.
    useEffect(() => {
        const off = subscribe("/topic/admin/rentals", (msg) => {
            const car = msg?.carName || "авто";
            if (msg?.type === "CREATED") toast.info(`Нова оренда: ${car}`);
            else if (msg?.type === "ACTIVATED") toast.info(`Оренду оплачено: ${car}`);
            else if (msg?.type === "EXPIRED") toast.warn(`Оренда прострочена: ${car} — авто на перевірці`);
            void refetchRef.current();
        });
        return off;
    }, [subscribe]);

    const totalPages = Math.max(1, Math.ceil(rentals.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pageRows = rentals.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const from = rentals.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
    const to = Math.min(safePage * PAGE_SIZE, rentals.length);

    return (
        <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 80px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
                <div style={{ flex: "1 1 360px", minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Адміністрування</div>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>Оренди користувачів</h1>
                    <p style={{ margin: "8px 0 0", color: "var(--text-muted)", fontSize: 15 }}>Перегляд активних та історичних оренд.</p>
                </div>
                <RefreshButton onClick={refresh} loading={loading} />
            </div>

            {/* Tabs + count */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
                <div style={{ display: "inline-flex", padding: 4, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", gap: 3 }}>
                    {[["active", "Активні"], ["all", "Усі оренди"]].map(([id, label]) => (
                        <button key={id} onClick={() => changeTab(id)} disabled={loading} style={{
                            padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit",
                            background: tab === id ? "var(--surface)" : "transparent", color: tab === id ? "var(--text)" : "var(--text-muted)",
                            boxShadow: tab === id ? "var(--shadow-sm)" : "none",
                        }}>{label}</button>
                    ))}
                </div>
                <span style={{ fontSize: 14, color: "var(--text-muted)" }}>Знайдено оренд: <b className="mono" style={{ color: "var(--text)" }}>{rentals.length}</b></span>
            </div>

            {loading ? (
                <div className="skel" style={{ height: 360, borderRadius: "var(--r-lg)" }} />
            ) : rentals.length === 0 ? (
                <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14.5 }}>
                    Оренд за вибраним режимом немає.
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 1080 }}>
                            <thead>
                                <tr style={{ background: "var(--surface-2)" }}>
                                    <TH>№</TH><TH>Користувач</TH><TH>Контакти</TH><TH>Авто</TH><TH>Тариф</TH>
                                    <TH>Період</TH><TH right>Сума</TH><TH>Бонуси</TH><TH>Фото</TH><TH>Статус</TH>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((r) => (
                                    <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                                        <td className="mono" style={{ padding: "13px 14px", color: "var(--text-faint)", fontWeight: 600 }}>{r.id}</td>
                                        <td style={{ padding: "13px 14px" }}>
                                            <div style={{ fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}>{r.userFullName}</div>
                                            <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>ID {r.userId}</div>
                                        </td>
                                        <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
                                            <a href={`mailto:${r.userEmail}`} style={{ color: "var(--accent-strong)", textDecoration: "none", fontSize: 12.5, display: "block" }}>{r.userEmail}</a>
                                            <a href={`tel:${r.userPhone}`} className="mono" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 12 }}>{r.userPhone}</a>
                                        </td>
                                        <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
                                            <div style={{ fontWeight: 600, color: "var(--text)" }}>{r.carBrand} {r.carModel}</div>
                                            <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>{r.carRegistrationNumber}</div>
                                        </td>
                                        <td style={{ padding: "13px 14px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{TARIFF_LABEL[r.tariffType] || r.tariffType}</td>
                                        <td style={{ padding: "13px 14px", color: "var(--text-muted)", fontSize: 12.5, whiteSpace: "nowrap" }}>
                                            {fmtDateTime(r.startTime)}<br />{fmtDateTime(r.endTime)}
                                        </td>
                                        <td className="mono" style={{ padding: "13px 14px", fontWeight: 700, color: "var(--text)", textAlign: "right", whiteSpace: "nowrap" }}>{money(r.totalPrice)}</td>
                                        <td className="mono" style={{ padding: "13px 14px", whiteSpace: "nowrap", color: Number(r.bonusUsed) > 0 ? "var(--accent-strong)" : "var(--text-faint)" }}>
                                            {Number(r.bonusUsed) > 0 ? `−${money(r.bonusUsed)}` : "—"}
                                        </td>
                                        <td style={{ padding: "13px 14px" }}>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <PhotoBtn count={r.beforePhotoCount} label="До" onClick={() => setPhoto({ rentalId: r.id, photoType: "BEFORE" })} />
                                                <PhotoBtn count={r.afterPhotoCount} label="Після" onClick={() => setPhoto({ rentalId: r.id, photoType: "AFTER" })} />
                                            </div>
                                        </td>
                                        <td style={{ padding: "13px 14px" }}>
                                            <StatusBadge status={r.status} map={RENTAL_STATUS_META} size="sm" />
                                            {r.status === "EXPIRED" && (
                                                <div style={{ fontSize: 11, color: "var(--warn)", marginTop: 4, maxWidth: 180 }}>Час вийшов — авто очікує перевірки адміністратором.</div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 16px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Показано <b className="mono" style={{ color: "var(--text)" }}>{from}–{to}</b> з <span className="mono">{rentals.length}</span></span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button className="icon-btn" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Назад" style={{ width: 36, height: 36 }}>
                                <Icons.ChevR size={16} style={{ transform: "rotate(180deg)" }} />
                            </button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button key={i} onClick={() => setPage(i + 1)} className="mono" style={{
                                    minWidth: 36, height: 36, borderRadius: "var(--r-sm)", cursor: "pointer", fontWeight: 700, fontSize: 13.5, fontFamily: "var(--font-mono)",
                                    border: `1px solid ${safePage === i + 1 ? "var(--accent)" : "var(--border)"}`,
                                    background: safePage === i + 1 ? "var(--accent)" : "var(--surface)",
                                    color: safePage === i + 1 ? "var(--accent-contrast)" : "var(--text-muted)",
                                }}>{i + 1}</button>
                            ))}
                            <button className="icon-btn" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Далі" style={{ width: 36, height: 36 }}>
                                <Icons.ChevR size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {photo && (
                <AdminRentalPhotosModal
                    rentalId={photo.rentalId}
                    photoType={photo.photoType}
                    onClose={() => setPhoto(null)}
                />
            )}
        </main>
    );
}
