import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
    getCurrentUserRequest,
    updateCurrentUserRequest,
    changePasswordRequest,
} from "../api/userApi";
import { getMyLicenseRequest, uploadLicenseRequest } from "../api/licensesApi";
import { getMyBonusBalanceRequest, getMyBonusHistoryRequest } from "../api/bonusesApi";
import { useRealtime } from "../realtime/realtimeContext";
import { Icons } from "../components/ui/Icons";
import { Avatar } from "../components/ui/Avatar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { money } from "../components/ui/money";
import { USER_STATUS_META, LICENSE_STATUS_META } from "../constants/labels";

/* Bonus ledger operation → UA label (BonusOperationType: EARN/SPEND/REFERRAL). */
const BONUS_OP_LABEL = {
    EARN: "Нарахування бонусів",
    SPEND: "Списання бонусів",
    REFERRAL: "Реферальний бонус",
};

const MONTHS = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"];
const pad2 = (n) => String(n).padStart(2, "0");
function fmtDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return `${fmtDate(value)}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const backendMsg = (error, fallback) =>
    error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{10,15}$/;

/* Saved cards — front-only stub (Д3: no backend endpoint). Static demo data. */
const PAYMENT_METHODS_STUB = [
    { id: "pm1", brand: "Visa", last4: "4242", exp: "08/27", primary: true },
    { id: "pm2", brand: "MC", last4: "5519", exp: "11/26", primary: false },
];

/* ---- small presentational helpers ---- */

const FieldLabel = ({ children }) => (
    <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
        {children}
    </div>
);

function ReadField({ label, value }) {
    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", wordBreak: "break-word" }}>{value || "—"}</div>
        </div>
    );
}

function EditField({ label, value, onChange, type = "text", placeholder, required }) {
    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <input
                className="input"
                type={type}
                value={value}
                placeholder={placeholder}
                required={required}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function InfoAlert({ tone = "ok", children }) {
    const palette = {
        ok: { bg: "var(--ok-soft)", fg: "var(--ok)", dot: "var(--ok)" },
        warn: { bg: "var(--warn-soft)", fg: "var(--warn)", dot: "var(--warn)" },
        danger: { bg: "var(--danger-soft)", fg: "var(--danger)", dot: "var(--danger)" },
    }[tone];
    return (
        <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: "var(--r-sm)", background: palette.bg, fontSize: 13.5, alignItems: "flex-start", color: "var(--text)" }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: palette.dot, marginTop: 6, flexShrink: 0 }} />
            <div>{children}</div>
        </div>
    );
}

function CardHeader({ icon, title, right }) {
    return (
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                {icon && <span style={{ color: "var(--accent-strong)", display: "flex" }}>{icon}</span>}
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>{title}</h2>
            </div>
            {right}
        </div>
    );
}

/* ---- Profile card (editable) ---- */

function ProfileCard({ user, bonusBalance, onUpdated }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({ fullName: user.fullName, email: user.email, phone: user.phone });
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const startEdit = () => {
        setDraft({ fullName: user.fullName, email: user.email, phone: user.phone });
        setEditing(true);
    };
    const cancel = () => setEditing(false);

    const validate = () => {
        if (!draft.fullName.trim()) return "Ім'я не може бути порожнім";
        if (!EMAIL_RE.test(draft.email)) return "Некоректний формат email";
        if (!PHONE_RE.test(draft.phone)) return "Телефон має містити 10-15 цифр і може починатися з +";
        return null;
    };

    const save = async () => {
        const err = validate();
        if (err) { toast.error(err); return; }
        setSaving(true);
        try {
            const updated = await updateCurrentUserRequest({
                fullName: draft.fullName.trim(),
                email: draft.email.trim(),
                phone: draft.phone.trim(),
            });
            onUpdated(updated);
            setEditing(false);
            toast.success("Профіль оновлено");
        } catch (error) {
            toast.error(backendMsg(error, "Не вдалося оновити профіль"));
        } finally {
            setSaving(false);
        }
    };

    const copy = async () => {
        try {
            await navigator.clipboard?.writeText(user.referralCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            toast.error("Не вдалося скопіювати код");
        }
    };

    return (
        <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "22px 24px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid var(--border)" }}>
                <Avatar name={user.fullName} size={56} />
                <div style={{ minWidth: 0, flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.fullName}</h2>
                    <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                </div>
                {!editing ? (
                    <button className="btn btn-ghost" onClick={startEdit}>Редагувати</button>
                ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-subtle" onClick={cancel} disabled={saving}>Скасувати</button>
                        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "…" : "Зберегти"}</button>
                    </div>
                )}
            </div>

            <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
                {editing ? (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                            <EditField label="Ім'я" value={draft.fullName} onChange={(v) => setDraft({ ...draft, fullName: v })} />
                            <EditField label="Телефон" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} />
                        </div>
                        <EditField label="Email" type="email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} />
                    </>
                ) : (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                            <ReadField label="Ім'я" value={user.fullName} />
                            <ReadField label="Телефон" value={user.phone} />
                        </div>
                        <ReadField label="Email" value={user.email} />
                    </>
                )}

                <div style={{ height: 1, background: "var(--border)" }} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <FieldLabel>Статус</FieldLabel>
                    <StatusBadge status={user.status} map={USER_STATUS_META} />
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                        <FieldLabel>Реферальний код</FieldLabel>
                        <span className="mono" style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.03em", padding: "5px 11px", borderRadius: "var(--r-xs)", background: "var(--surface-2)", border: "1px dashed var(--border-strong)", color: "var(--text)" }}>{user.referralCode}</span>
                    </div>
                    <button className="btn btn-ghost" onClick={copy} style={{ minWidth: 124 }}>
                        {copied ? <><Icons.Check size={16} sw={2.6} style={{ color: "var(--ok)" }} /> Скопійовано</> : "Копіювати"}
                    </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderRadius: "var(--r-md)", background: "var(--accent-soft)", border: "1px solid var(--accent)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <Icons.Gift size={22} style={{ color: "var(--accent-strong)" }} />
                        <span style={{ fontWeight: 700, fontSize: 14.5, color: "var(--accent-strong)" }}>Баланс бонусів</span>
                    </div>
                    <span className="mono" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--accent-strong)" }}>{money(bonusBalance)}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-faint)" }}>Запросіть друга за реферальним кодом — і ви обидва отримаєте бонуси.</p>
            </div>
        </div>
    );
}

/* ---- Driver license card ---- */

function LicenseUploadForm({ onUploaded }) {
    const [form, setForm] = useState({ documentNumber: "", issueDate: "", expiryDate: "", image: null });
    const [drag, setDrag] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef(null);

    const pickFile = (file) => {
        if (file && !file.type.startsWith("image/")) {
            toast.error("Дозволені лише зображення (JPG або PNG)");
            return;
        }
        setForm((prev) => ({ ...prev, image: file || null }));
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.documentNumber.trim()) { toast.error("Вкажіть номер документа"); return; }
        if (!form.issueDate) { toast.error("Вкажіть дату видачі"); return; }
        if (!form.expiryDate) { toast.error("Вкажіть дату завершення"); return; }
        if (!form.image) { toast.error("Додайте фото посвідчення"); return; }

        setSubmitting(true);
        try {
            await uploadLicenseRequest(form);
            toast.success("Посвідчення завантажено на перевірку");
            await onUploaded();
        } catch (error) {
            toast.error(backendMsg(error, "Не вдалося завантажити посвідчення"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <EditField label="Номер документа" placeholder="ВАА 123456" value={form.documentNumber} onChange={(v) => setForm({ ...form, documentNumber: v })} />
                <EditField label="Дата видачі" type="date" value={form.issueDate} onChange={(v) => setForm({ ...form, issueDate: v })} />
            </div>
            <EditField label="Дійсне до" type="date" value={form.expiryDate} onChange={(v) => setForm({ ...form, expiryDate: v })} />

            <div>
                <FieldLabel>Зображення посвідчення</FieldLabel>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => pickFile(e.target.files?.[0])}
                />
                <div
                    onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files?.[0]); }}
                    onClick={() => inputRef.current?.click()}
                    style={{
                        height: 150, borderRadius: "var(--r-md)", cursor: "pointer", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 8, textAlign: "center",
                        border: `1.5px dashed ${drag ? "var(--accent)" : "var(--border-strong)"}`,
                        background: drag ? "var(--accent-soft)" : "var(--surface-2)", transition: "all .15s ease", color: "var(--text-muted)",
                    }}
                >
                    {form.image ? (
                        <>
                            <Icons.Check size={26} sw={2.2} style={{ color: "var(--ok)" }} />
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{form.image.name}</span>
                        </>
                    ) : (
                        <>
                            <Icons.Plus size={24} style={{ color: "var(--accent-strong)" }} />
                            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Перетягніть фото або натисніть, щоб обрати</span>
                            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>JPG або PNG, до 10 МБ</span>
                        </>
                    )}
                </div>
            </div>

            <button className="btn btn-primary" type="submit" style={{ width: "100%", padding: 13 }} disabled={submitting}>
                {submitting ? "Завантаження…" : "Завантажити посвідчення"}
            </button>
        </form>
    );
}

function LicenseCard({ license, onChanged }) {
    const status = license?.status ?? null;
    const showForm = !license || status === "REJECTED";

    return (
        <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <CardHeader
                icon={<Icons.User size={20} />}
                title="Водійське посвідчення"
                right={status && <StatusBadge status={status} map={LICENSE_STATUS_META} />}
            />

            <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
                {status === "REJECTED" && license?.rejectionReason && (
                    <InfoAlert tone="danger"><b>Відхилено:</b> {license.rejectionReason}</InfoAlert>
                )}

                {!showForm ? (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                            <ReadField label="Номер документа" value={license.documentNumber} />
                            <ReadField label="Завантажено" value={fmtDate(license.createdAt)} />
                        </div>
                        {license.imageUrl ? (
                            <img
                                src={license.imageUrl}
                                alt="Водійське посвідчення"
                                style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}
                            />
                        ) : (
                            <div className="img-ph" style={{ height: 180, borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                                <span>скан посвідчення</span>
                            </div>
                        )}
                        {status === "PENDING" && <InfoAlert tone="warn">Документ на перевірці адміністратором. Зазвичай це займає до 24 годин.</InfoAlert>}
                        {status === "APPROVED" && <InfoAlert tone="ok">Посвідчення підтверджено — ви можете орендувати авто.</InfoAlert>}
                    </>
                ) : (
                    <>
                        {!license && (
                            <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>
                                Щоб орендувати авто, завантажте водійське посвідчення для перевірки.
                            </p>
                        )}
                        <LicenseUploadForm onUploaded={onChanged} />
                    </>
                )}
            </div>
        </div>
    );
}

/* ---- Bonus history ---- */

function BonusHistoryCard({ rows }) {
    return (
        <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <CardHeader icon={<Icons.Gift size={18} />} title="Історія бонусів" />
            {rows.length === 0 ? (
                <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                    Операцій із бонусами поки немає.
                </div>
            ) : (
                <div>
                    {rows.map((r, i) => {
                        const amount = Number(r.amount ?? 0);
                        const positive = amount > 0;
                        return (
                            <div key={r.id ?? i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 22px", borderTop: i ? "1px solid var(--border)" : "none" }}>
                                <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", background: positive ? "var(--ok-soft)" : "var(--surface-2)", color: positive ? "var(--ok)" : "var(--text-faint)" }}>
                                    {positive ? <Icons.Plus size={16} sw={2.4} /> : <Icons.Bolt size={15} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text)" }}>{r.description || BONUS_OP_LABEL[r.operationType] || "Операція"}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{fmtDateTime(r.createdAt)}</div>
                                </div>
                                <span className="mono" style={{ fontWeight: 800, fontSize: 14.5, color: positive ? "var(--ok)" : "var(--text-muted)" }}>
                                    {positive ? "+" : ""}{money(amount)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ---- Security: change password ---- */

function SecurityCard() {
    const [pw, setPw] = useState({ cur: "", next: "", conf: "" });
    const [saving, setSaving] = useState(false);
    const set = (k) => (v) => setPw((prev) => ({ ...prev, [k]: v }));

    const save = async () => {
        if (!pw.cur) { toast.error("Введіть поточний пароль"); return; }
        if (pw.next.length < 6) { toast.error("Новий пароль — мінімум 6 символів"); return; }
        if (pw.next !== pw.conf) { toast.error("Паролі не співпадають"); return; }
        if (pw.next === pw.cur) { toast.error("Новий пароль має відрізнятися від поточного"); return; }

        setSaving(true);
        try {
            await changePasswordRequest({
                currentPassword: pw.cur,
                newPassword: pw.next,
                confirmPassword: pw.conf,
            });
            setPw({ cur: "", next: "", conf: "" });
            toast.success("Пароль змінено");
        } catch (error) {
            toast.error(backendMsg(error, "Не вдалося змінити пароль"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <CardHeader icon={<Icons.Bolt size={18} />} title="Безпека" />
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                <EditField label="Поточний пароль" type="password" value={pw.cur} onChange={set("cur")} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <EditField label="Новий пароль" type="password" value={pw.next} onChange={set("next")} />
                    <EditField label="Підтвердження" type="password" value={pw.conf} onChange={set("conf")} />
                </div>
                <button className="btn btn-ghost" style={{ alignSelf: "flex-start" }} onClick={save} disabled={saving}>
                    {saving ? "Збереження…" : "Змінити пароль"}
                </button>
            </div>
        </div>
    );
}

/* ---- Payment methods (Д3 front-stub: no backend) ---- */

function PaymentCard() {
    const [methods, setMethods] = useState(PAYMENT_METHODS_STUB);
    const setPrimary = (id) => setMethods((m) => m.map((x) => ({ ...x, primary: x.id === id })));
    const remove = (id) => setMethods((m) => m.filter((x) => x.id !== id));

    return (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <CardHeader
                icon={<Icons.Gift size={18} />}
                title="Способи оплати"
                right={
                    <button className="btn btn-subtle" style={{ padding: "6px 10px" }} onClick={() => toast.info("Додавання картки — незабаром")}>
                        <Icons.Plus size={16} /> Додати
                    </button>
                }
            />
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {methods.length === 0 ? (
                    <div style={{ padding: "20px 8px", textAlign: "center", color: "var(--text-muted)", fontSize: 13.5 }}>Збережених карток немає.</div>
                ) : (
                    methods.map((m) => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 14px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", background: "var(--surface)" }}>
                            <div style={{ width: 42, height: 30, borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.02em" }}>
                                {m.brand === "Visa" ? "VISA" : "MC"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="mono" style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>•••• {m.last4}</div>
                                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>до {m.exp}</div>
                            </div>
                            {m.primary ? (
                                <span className="badge badge--available" style={{ fontSize: 11 }}><span className="dot" />Основна</span>
                            ) : (
                                <button className="btn btn-subtle" style={{ padding: "5px 10px", fontSize: 12.5 }} onClick={() => setPrimary(m.id)}>Зробити основною</button>
                            )}
                            <button className="icon-btn" style={{ width: 32, height: 32, color: "var(--text-faint)" }} aria-label="Видалити" onClick={() => remove(m.id)}>
                                <Icons.Trash size={15} />
                            </button>
                        </div>
                    ))
                )}
                <p style={{ margin: "4px 6px 2px", fontSize: 11.5, color: "var(--text-faint)" }}>
                    Демонстраційні дані. Збереження карток у профілі ще не підключено.
                </p>
            </div>
        </div>
    );
}

/* ---- Page ---- */

export default function ProfilePage() {
    const { subscribe } = useRealtime();
    const [user, setUser] = useState(null);
    const [license, setLicense] = useState(null);
    const [bonusBalance, setBonusBalance] = useState(0);
    const [bonusHistory, setBonusHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadLicense = async () => {
        try {
            setLicense(await getMyLicenseRequest());
        } catch {
            setLicense(null);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            setUser(await getCurrentUserRequest());
            try {
                const bonus = await getMyBonusBalanceRequest();
                setBonusBalance(Number(bonus?.balance ?? 0));
            } catch {
                setBonusBalance(0);
            }
            try {
                setBonusHistory(await getMyBonusHistoryRequest());
            } catch {
                setBonusHistory([]);
            }
            await loadLicense();
        } catch {
            toast.error("Не вдалося завантажити профіль");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void (async () => { await loadData(); })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep the latest license refetch in a ref so the long-lived subscription
    // calls the current closure (ref updated in an effect, never during render).
    const refetchLicenseRef = useRef(() => {});
    useEffect(() => { refetchLicenseRef.current = loadLicense; });

    // Live driver-license verdict (/user/queue/license — delivered only to this
    // user): toast the decision and refetch so the card reflects it without reload.
    useEffect(() => {
        const off = subscribe("/user/queue/license", (msg) => {
            if (msg?.status === "APPROVED") {
                toast.success("Ваше посвідчення підтверджено — можна орендувати авто!");
            } else if (msg?.status === "REJECTED") {
                toast.error(msg.rejectionReason
                    ? `Посвідчення відхилено: ${msg.rejectionReason}`
                    : "Ваше посвідчення відхилено");
            }
            void refetchLicenseRef.current();
        });
        return off;
    }, [subscribe]);

    if (loading) {
        return (
            <main style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 24px 80px" }}>
                <div className="skel" style={{ height: 38, width: 220, marginBottom: 24 }} />
                <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
                    <div className="skel" style={{ height: 420, borderRadius: "var(--r-lg)" }} />
                    <div className="skel" style={{ height: 420, borderRadius: "var(--r-lg)" }} />
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 24px 80px" }}>
                <div className="card" style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)" }}>Користувача не знайдено.</div>
            </main>
        );
    }

    return (
        <main style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 24px 80px" }}>
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Особистий кабінет</div>
                <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>Профіль</h1>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "start" }}>
                    <ProfileCard user={user} bonusBalance={bonusBalance} onUpdated={setUser} />
                    <LicenseCard license={license} onChanged={loadData} />
                </div>
                <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "start" }}>
                    <BonusHistoryCard rows={bonusHistory} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                        <SecurityCard />
                        <PaymentCard />
                    </div>
                </div>
            </div>
        </main>
    );
}
