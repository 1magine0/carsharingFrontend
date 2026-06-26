import { useEffect, useState } from "react";
import { Icons } from "../ui/Icons";
import { money } from "../ui/money";
import { TARIFF_LABEL } from "../../constants/labels";
import { previewRentalRequest, createRentalRequest } from "../../api/rentalsApi";
import { notifyBalanceChanged } from "../../utils/balanceEvents";

const TARIFFS = [
  { id: "HOUR", unit: "год", key: "pricePerHour", hint: "Гнучко для коротких поїздок" },
  { id: "DAY", unit: "доба", key: "pricePerDay", hint: "Вигідно на цілий день" },
  { id: "MONTH", unit: "міс", key: "pricePerMonth", hint: "Найкраща ставка надовго" },
];

const pad2 = (n) => String(n).padStart(2, "0");
const toLocal = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
// Start "now" (floored to the current minute by toLocal, so startTime is always
// ≤ real clock). A rounded-up "next hour" default put startTime in the future,
// which made unlockCar reject with "Оренда ще не почалася" right after booking.
const defaultStart = () => toLocal(new Date());
const addByTariff = (localStr, tariff) => {
  const d = new Date(localStr);
  if (tariff === "HOUR") d.setHours(d.getHours() + 4);
  else if (tariff === "DAY") d.setDate(d.getDate() + 1);
  else d.setMonth(d.getMonth() + 1);
  return toLocal(d);
};
const MONTHS = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"];
const fmtRange = (localStr) => { const d = new Date(localStr); return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };

function StepDots({ step, total = 3 }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ height: 6, borderRadius: 99, transition: "all .3s ease", width: i === step ? 26 : 6, background: i <= step ? "var(--accent)" : "var(--border-strong)" }} />
      ))}
    </div>
  );
}

function Label({ children, style }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", ...style }}>{children}</div>;
}

function Row({ k, v, accentV }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
      <span style={{ color: "var(--text-muted)" }}>{k}</span>
      <span className="mono" style={{ fontWeight: 700, color: accentV ? "var(--accent-strong)" : "var(--text)" }}>{v}</span>
    </div>
  );
}

function ConfirmDone({ car, tInfo, finalPrice, bonus, onClose }) {
  return (
    <div style={{ padding: "44px 32px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ width: 72, height: 72, borderRadius: 99, display: "grid", placeItems: "center", background: "var(--ok-soft)", color: "var(--ok)", marginBottom: 6, animation: "scaleIn .4s cubic-bezier(0.22,1,0.36,1)" }}>
        <Icons.Check size={38} sw={2.6} />
      </div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>Оренда оформлена!</h2>
      <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: 14.5, maxWidth: 360 }}>
        {car.brand} {car.model} заброньовано. Завантажте фото «до» у розділі «Мої оренди», щоб розблокувати авто.
      </p>
      <div style={{ marginTop: 18, width: "100%", padding: "16px 18px", borderRadius: "var(--r-md)", background: "var(--surface-2)", display: "flex", flexDirection: "column", gap: 8 }}>
        <Row k="Тариф" v={TARIFF_LABEL[tInfo.id]} />
        {bonus > 0 && <Row k="Бонуси" v={`−${money(bonus)} грн`} accentV />}
        <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "var(--text)" }}>Сума</span>
          <span className="mono" style={{ fontWeight: 800, fontSize: 20, color: "var(--accent-strong)" }}>{money(finalPrice)} грн</span>
        </div>
      </div>
      <button className="btn btn-primary" style={{ marginTop: 20, width: "100%", padding: "13px" }} onClick={onClose}>Чудово, до оренд</button>
    </div>
  );
}

/* 3-step rental flow. Prices/bonus caps come from the live preview endpoint (Д6). */
export function RentModal({ car, onClose, onSuccess, onDone }) {
  const [step, setStep] = useState(0);
  const [tariff, setTariff] = useState("HOUR");
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(() => addByTariff(defaultStart(), "HOUR"));
  const [bonus, setBonus] = useState(0);

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState("");
  const [done, setDone] = useState(false);

  const tInfo = TARIFFS.find((t) => t.id === tariff);
  const validRange = new Date(end) > new Date(start);

  // Period/tariff changes happen in handlers (not effects) so we never call
  // setState synchronously inside an effect body.
  const chooseTariff = (id) => { setTariff(id); setEnd(addByTariff(start, id)); setBonus(0); };
  const changeStart = (v) => { setStart(v); setBonus(0); };
  const changeEnd = (v) => { setEnd(v); setBonus(0); };

  // Live price preview whenever a valid period is set (all setState inside the
  // async IIFE, so the linter doesn't see synchronous setState in the effect).
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!validRange) { setPreview(null); setPreviewError(""); return; }
      setPreviewLoading(true);
      setPreviewError("");
      try {
        const data = await previewRentalRequest({ carId: car.id, tariffType: tariff, startTime: start, endTime: end });
        if (alive) setPreview(data);
      } catch (err) {
        if (!alive) return;
        setPreview(null);
        setPreviewError(err?.response?.data?.message || err?.response?.data?.error || "Не вдалося розрахувати оренду");
      } finally {
        if (alive) setPreviewLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [car.id, tariff, start, end, validRange]);

  const basePrice = Number(preview?.basePrice ?? 0);
  // Bonuses are whole units (V8 rounds the 1% EARN; SPEND is integer) — floor the
  // 10% cap and round the chosen amount so the slider/manual input stay kopeck-free.
  const maxBonus = Math.floor(Number(preview?.maxBonusUsage ?? 0));
  const clampedBonus = Math.min(Math.max(Math.round(Number(bonus) || 0), 0), maxBonus);
  const finalPrice = Math.max(basePrice - clampedBonus, 0);
  const availableBonus = Number(preview?.availableBonusBalance ?? 0);

  const canLeaveStep1 = validRange && preview && !previewLoading && !previewError;

  const next = () => {
    if (step === 1 && !canLeaveStep1) return;
    if (step < 2) setStep(step + 1);
    else submit();
  };
  const back = () => step > 0 && setStep(step - 1);

  const submit = async () => {
    setSubmitting(true);
    setTopError("");
    try {
      await createRentalRequest({
        carId: car.id,
        tariffType: tariff,
        startTime: start,
        endTime: end,
        bonusUsed: clampedBonus,
      });
      // Booking spends bonus immediately (SPEND ledger row) — refresh the navbar pill.
      if (clampedBonus > 0) notifyBalanceChanged();
      setDone(true);
      onSuccess?.();
    } catch (err) {
      setTopError(err?.response?.data?.message || err?.response?.data?.error || "Не вдалося створити оренду");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 20,
      background: "color-mix(in oklch, var(--bg) 30%, oklch(0.15 0.02 295 / 0.55))",
      backdropFilter: "blur(8px)", animation: "overlayIn .25s ease",
    }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{
        width: "min(560px, 100%)", maxHeight: "92vh", overflow: "hidden",
        boxShadow: "var(--shadow-lg)", borderRadius: "var(--r-lg)",
        animation: "popIn .3s cubic-bezier(0.22,1,0.36,1)", display: "flex", flexDirection: "column",
      }}>
        {done ? (
          <ConfirmDone car={car} tInfo={tInfo} finalPrice={finalPrice} bonus={clampedBonus} onClose={onDone || onClose} />
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Оренда авто</div>
                  <h2 style={{ margin: "4px 0 4px", fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>{car.brand} {car.model}</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)", fontSize: 13 }}>
                    <Icons.Pin size={14} />{car.address}{car.registrationNumber ? <> · <span className="mono">{car.registrationNumber}</span></> : null}
                  </div>
                </div>
                <button className="icon-btn" onClick={onClose} aria-label="Закрити"><Icons.Close size={18} /></button>
              </div>
              <div style={{ marginTop: 16 }}><StepDots step={step} /></div>
            </div>

            {/* Body */}
            <div style={{ padding: "22px 24px", overflowY: "auto" }}>
              {topError && (
                <div style={{ marginBottom: 16, padding: "11px 14px", borderRadius: "var(--r-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13.5, fontWeight: 600 }}>{topError}</div>
              )}

              {step === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Label>Оберіть тариф</Label>
                  {TARIFFS.map((t) => {
                    const sel = tariff === t.id;
                    return (
                      <button key={t.id} onClick={() => chooseTariff(t.id)} style={{
                        textAlign: "left", padding: "15px 16px", borderRadius: "var(--r-md)", cursor: "pointer",
                        border: `1.5px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                        background: sel ? "var(--accent-soft)" : "var(--surface)",
                        display: "flex", alignItems: "center", gap: 14, transition: "all .15s ease",
                      }}>
                        <div style={{ width: 22, height: 22, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center", border: `2px solid ${sel ? "var(--accent)" : "var(--border-strong)"}`, background: sel ? "var(--accent)" : "transparent" }}>
                          {sel && <Icons.Check size={13} sw={3} style={{ color: "var(--accent-contrast)" }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{TARIFF_LABEL[t.id]}</div>
                          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{t.hint}</div>
                        </div>
                        <div className="mono" style={{ fontSize: 17, fontWeight: 800, color: sel ? "var(--accent-strong)" : "var(--text)" }}>
                          {money(car[t.key])}<span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>/{t.unit}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <Label style={{ marginBottom: 8 }}>Початок</Label>
                      <input type="datetime-local" className="input" value={start} onChange={(e) => changeStart(e.target.value)} style={{ height: 46, cursor: "pointer" }} />
                    </div>
                    <div>
                      <Label style={{ marginBottom: 8 }}>Завершення</Label>
                      <input type="datetime-local" className="input" value={end} min={start} onChange={(e) => changeEnd(e.target.value)} style={{ height: 46, cursor: "pointer", borderColor: validRange ? undefined : "var(--danger)" }} />
                    </div>
                  </div>
                  {!validRange && <div style={{ fontSize: 12.5, color: "var(--danger)", fontWeight: 600, marginTop: -8 }}>Час завершення має бути пізніше за початок</div>}

                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: "var(--r-md)", background: "var(--accent-soft)", border: "1px solid var(--accent)" }}>
                    <Icons.Clock size={18} style={{ color: "var(--accent-strong)" }} />
                    <span style={{ fontSize: 13.5, color: "var(--accent-strong)", fontWeight: 600 }}>
                      {validRange ? <>{fmtRange(start)} → {fmtRange(end)}</> : "Оберіть період оренди"}
                    </span>
                  </div>

                  {previewError && <div style={{ fontSize: 13, color: "var(--danger)", fontWeight: 600 }}>{previewError}</div>}

                  <div style={{ padding: "13px 16px", borderRadius: "var(--r-md)", background: "var(--surface-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Базова вартість</span>
                    <span className="mono" style={{ fontWeight: 800, fontSize: 19, color: "var(--text)" }}>
                      {previewLoading ? "…" : preview ? money(basePrice) : "—"} <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>грн</span>
                    </span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Label style={{ margin: 0 }}>Списати бонуси</Label>
                      <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Доступно: <b className="mono" style={{ color: "var(--accent-strong)" }}>{money(availableBonus)}</b></span>
                    </div>
                    <input type="range" min={0} max={maxBonus} step={1} value={clampedBonus} onChange={(e) => setBonus(+e.target.value)} disabled={!preview || maxBonus <= 0}
                      className="bonus-range" style={{ width: "100%", marginTop: 14, "--fill": maxBonus ? `${(clampedBonus / maxBonus) * 100}%` : "0%" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--text-faint)" }}>0</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Обрано</span>
                        <span className="mono" style={{ fontWeight: 800, color: "var(--accent-strong)", fontSize: 15 }}>−</span>
                        {/* Click-to-type manual amount (kept in sync with the slider); integer, clamped to [0, maxBonus]. */}
                        <input
                          type="number" inputMode="numeric" min={0} max={maxBonus} step={1}
                          value={clampedBonus}
                          disabled={!preview || maxBonus <= 0}
                          onChange={(e) => setBonus(e.target.value === "" ? 0 : Math.floor(Number(e.target.value)))}
                          aria-label="Кількість бонусів для списання"
                          className="mono bonus-input"
                          style={{ width: 62, textAlign: "right", fontWeight: 800, fontSize: 15, color: "var(--accent-strong)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-xs)", padding: "3px 7px", fontFamily: "inherit" }}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text-faint)" }} className="mono">{money(maxBonus)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 6 }}>Максимум бонусів обмежено системою для цієї оренди.</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 18px", borderRadius: "var(--r-md)", background: "var(--surface-2)" }}>
                    <Row k="Базова вартість" v={`${money(basePrice)} грн`} />
                    <Row k="Знижка бонусами" v={`−${money(clampedBonus)} грн`} accentV />
                    <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>До сплати</span>
                      <span className="mono" style={{ fontWeight: 800, fontSize: 27, letterSpacing: "-0.03em", color: "var(--accent-strong)" }}>{money(Number(finalPrice.toFixed(2)))} <span style={{ fontSize: 14, color: "var(--text-muted)" }}>грн</span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "center" }}>
              {step > 0
                ? <button className="btn btn-ghost" onClick={back} disabled={submitting}>Назад</button>
                : <button className="btn btn-subtle" onClick={onClose}>Скасувати</button>}
              <div style={{ flex: 1 }} />
              {step === 2 && preview && <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: "var(--text-muted)" }}>{money(Number(finalPrice.toFixed(2)))} грн</span>}
              <button className="btn btn-primary" onClick={next} disabled={(step === 1 && !canLeaveStep1) || submitting}>
                {step < 2 ? "Далі" : submitting ? "Створення…" : "Підтвердити оренду"} {step < 2 && <Icons.ChevR size={16} sw={2.4} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RentModal;
