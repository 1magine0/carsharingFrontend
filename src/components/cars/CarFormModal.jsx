import { useEffect, useState } from "react";
import {
  createCarRequest,
  updateCarRequest,
  uploadCarImageRequest,
  getCarImagesRequest,
  setMainCarImageRequest,
  deleteCarImageRequest,
} from "../../api/adminCarsApi";
import { FUEL_LABEL, TRANSMISSION_LABEL, STATUS_META } from "../../constants/labels";
import { Icons } from "../ui/Icons";
import LocationPicker from "../LocationPicker";
import ConfirmModal from "../ConfirmModal";

/* Drivo admin Add/Edit-car modal (Phase 5) — replaces the Bootstrap LegacyCarModal.
   Unlike the legacy form it sends fuelType/transmission (Fix 19) + seats (V7), so
   create/update no longer returns 400. Reuses LocationPicker (Nominatim) + the
   adminCarsApi photo endpoints (upload / set-main / delete). */

/* Admin may set any status; RESERVED is system-managed so it's omitted here. */
const STATUS_OPTIONS = ["AVAILABLE", "RENTED", "SERVICE", "INACTIVE"];
const FUEL_OPTIONS = Object.keys(FUEL_LABEL);
const TRANSMISSION_OPTIONS = Object.keys(TRANSMISSION_LABEL);

const EMPTY_FORM = {
  brand: "", model: "", year: "", registrationNumber: "", color: "",
  fuelType: "PETROL", transmission: "MANUAL", seats: "5",
  pricePerHour: "", pricePerDay: "", pricePerMonth: "", status: "AVAILABLE",
  address: "", latitude: "", longitude: "",
};

function buildForm(mode, car) {
  if (mode !== "edit" || !car) return EMPTY_FORM;
  return {
    brand: car.brand || "", model: car.model || "", year: car.year || "",
    registrationNumber: car.registrationNumber || "", color: car.color || "",
    fuelType: car.fuelType || "PETROL", transmission: car.transmission || "MANUAL",
    seats: car.seats != null ? String(car.seats) : "5",
    pricePerHour: car.pricePerHour || "", pricePerDay: car.pricePerDay || "",
    pricePerMonth: car.pricePerMonth || "", status: car.status || "AVAILABLE",
    address: car.address || "", latitude: car.latitude || "", longitude: car.longitude || "",
  };
}

/* Labelled field wrapper (design-system styling). */
function Field({ label, children, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}`, display: "flex", flexDirection: "column", gap: 7 }}>
      <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</label>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ gridColumn: "1 / -1", fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginTop: 4 }}>{children}</div>;
}

export default function CarFormModal({ mode, car, onClose, onSaved }) {
  const [form, setForm] = useState(() => buildForm(mode, car));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imageIsMain, setImageIsMain] = useState(mode === "create");
  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

  const editingCarId = mode === "edit" ? car?.id : null;

  const loadImages = async (carId) => {
    if (!carId) return;
    setImagesLoading(true);
    try {
      setImages(await getCarImagesRequest(carId));
    } catch {
      setImages([]);
    } finally {
      setImagesLoading(false);
    }
  };

  // setState lives inside the async IIFE (not the effect body) — keeps the
  // react-hooks/set-state-in-effect lint happy, matching the catalog pattern.
  useEffect(() => {
    if (editingCarId) void (async () => { await loadImages(editingCarId); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => ({
    brand: form.brand, model: form.model, year: Number(form.year),
    registrationNumber: form.registrationNumber, color: form.color,
    fuelType: form.fuelType, transmission: form.transmission, seats: Number(form.seats),
    pricePerHour: Number(form.pricePerHour), pricePerDay: Number(form.pricePerDay),
    pricePerMonth: Number(form.pricePerMonth), status: form.status,
    address: form.address, latitude: Number(form.latitude), longitude: Number(form.longitude),
  });

  const handleSave = async () => {
    setError("");
    if (!form.brand.trim() || !form.model.trim()) {
      setError("Вкажіть бренд і модель");
      return;
    }
    if (form.latitude === "" || form.latitude === null || form.longitude === "" || form.longitude === null) {
      setError("Оберіть місцезнаходження на мапі");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      let savedCar;
      if (mode === "create") savedCar = await createCarRequest(payload);
      else savedCar = await updateCarRequest(editingCarId, payload);

      const targetCarId = mode === "create" ? savedCar.id : editingCarId;
      if (imageFile) await uploadCarImageRequest(targetCarId, imageFile, imageIsMain);

      onSaved?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Не вдалося зберегти авто");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async () => {
    if (!editingCarId || !imageFile) {
      setError("Оберіть фото для завантаження");
      return;
    }
    setError("");
    try {
      await uploadCarImageRequest(editingCarId, imageFile, imageIsMain);
      setImageFile(null);
      setImageIsMain(false);
      await loadImages(editingCarId);
      onSaved?.();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Не вдалося завантажити фото авто");
    }
  };

  const handleSetMain = async (imageId) => {
    setError("");
    try {
      await setMainCarImageRequest(imageId);
      await loadImages(editingCarId);
      onSaved?.();
    } catch {
      setError("Не вдалося зробити фото головним");
    }
  };

  const performDeleteImage = async () => {
    const imageId = imageToDelete;
    setImageToDelete(null);
    setError("");
    try {
      await deleteCarImageRequest(imageId);
      await loadImages(editingCarId);
      onSaved?.();
    } catch {
      setError("Не вдалося видалити фото");
    }
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 20,
        background: "color-mix(in oklch, var(--bg) 30%, oklch(0.15 0.02 295 / 0.55))",
        backdropFilter: "blur(8px)", animation: "overlayIn .25s ease",
      }}>
        <div onClick={(e) => e.stopPropagation()} className="card" style={{
          width: "min(680px, 100%)", maxHeight: "92vh", overflow: "hidden",
          boxShadow: "var(--shadow-lg)", borderRadius: "var(--r-lg)",
          animation: "popIn .3s cubic-bezier(0.22,1,0.36,1)", display: "flex", flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Адмін · автопарк</div>
              <h2 style={{ margin: "4px 0 0", fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
                {mode === "create" ? "Додати авто" : "Редагувати авто"}
              </h2>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Закрити"><Icons.Close size={18} /></button>
          </div>

          {/* Body */}
          <div style={{ padding: "22px 24px", overflowY: "auto" }}>
            {error && (
              <div style={{ marginBottom: 18, padding: "11px 14px", borderRadius: "var(--r-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13.5, fontWeight: 600 }}>{error}</div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <SectionTitle>Основне</SectionTitle>
              <Field label="Бренд"><input className="input" name="brand" value={form.brand} onChange={change} /></Field>
              <Field label="Модель"><input className="input" name="model" value={form.model} onChange={change} /></Field>
              <Field label="Рік"><input className="input" type="number" min="2000" max="2100" name="year" value={form.year} onChange={change} /></Field>
              <Field label="Колір"><input className="input" name="color" value={form.color} onChange={change} /></Field>
              <Field label="Номерний знак" span={2}>
                <input className="input" name="registrationNumber" value={form.registrationNumber} onChange={change} />
              </Field>

              <SectionTitle>Характеристики</SectionTitle>
              <Field label="Тип пального">
                <select className="input" name="fuelType" value={form.fuelType} onChange={change}>
                  {FUEL_OPTIONS.map((k) => <option key={k} value={k}>{FUEL_LABEL[k]}</option>)}
                </select>
              </Field>
              <Field label="Коробка передач">
                <select className="input" name="transmission" value={form.transmission} onChange={change}>
                  {TRANSMISSION_OPTIONS.map((k) => <option key={k} value={k}>{TRANSMISSION_LABEL[k]}</option>)}
                </select>
              </Field>
              <Field label="Місць">
                {/* bounds mirror the DB CHECK chk_cars_seats (1–9) + CarRequest @Min/@Max */}
                <input className="input" type="number" min="1" max="9" name="seats" value={form.seats} onChange={change} />
              </Field>
              <Field label="Статус" span={3}>
                <select className="input" name="status" value={form.status} onChange={change}>
                  {STATUS_OPTIONS.map((k) => <option key={k} value={k}>{STATUS_META[k]?.label || k}</option>)}
                </select>
              </Field>

              <SectionTitle>Тарифи, грн</SectionTitle>
              <Field label="За годину"><input className="input" type="number" step="0.01" name="pricePerHour" value={form.pricePerHour} onChange={change} /></Field>
              <Field label="За добу"><input className="input" type="number" step="0.01" name="pricePerDay" value={form.pricePerDay} onChange={change} /></Field>
              <Field label="За місяць"><input className="input" type="number" step="0.01" name="pricePerMonth" value={form.pricePerMonth} onChange={change} /></Field>
            </div>

            {/* Location (reused Nominatim picker) */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Розташування</div>
              <LocationPicker
                value={{ address: form.address, latitude: form.latitude, longitude: form.longitude }}
                onChange={(loc) => setForm((prev) => ({ ...prev, ...loc }))}
              />
            </div>

            {/* Photos */}
            <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 18 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Фото авто</div>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)}
                style={{ fontSize: 13.5, color: "var(--text-muted)" }} />
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13.5, color: "var(--text-muted)", cursor: "pointer" }}>
                <input type="checkbox" checked={imageIsMain} onChange={(e) => setImageIsMain(e.target.checked)} />
                Зробити це фото головним
              </label>
              {mode === "create" && (
                <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 8 }}>Фото завантажиться після створення авто.</div>
              )}
              {mode === "edit" && (
                <button type="button" className="btn btn-ghost" style={{ marginTop: 12 }} onClick={handleUploadImage} disabled={!imageFile}>
                  <Icons.Plus size={16} /> Завантажити фото
                </button>
              )}

              {mode === "edit" && (
                <div style={{ marginTop: 16 }}>
                  {imagesLoading ? (
                    <div style={{ color: "var(--text-muted)", fontSize: 13.5 }}>Завантаження фото…</div>
                  ) : images.length === 0 ? (
                    <div style={{ color: "var(--text-faint)", fontSize: 13.5 }}>Фото ще не додані.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                      {images.map((image) => (
                        <div key={image.id} className="card" style={{ overflow: "hidden", padding: 0, boxShadow: "none" }}>
                          <div style={{ position: "relative" }}>
                            <img src={image.imageUrl} alt="Авто" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
                            {image.isMain && (
                              <span className="badge badge--available" style={{ position: "absolute", top: 8, left: 8, fontSize: 11, padding: "3px 8px" }}>
                                <span className="dot" />Головне
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 6, padding: 8 }}>
                            {!image.isMain && (
                              <button type="button" className="btn btn-subtle" style={{ flex: 1, padding: "7px 8px", fontSize: 12.5 }} onClick={() => handleSetMain(image.id)}>
                                Головне
                              </button>
                            )}
                            <button type="button" className="icon-btn" aria-label="Видалити фото" onClick={() => setImageToDelete(image.id)}>
                              <Icons.Trash size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn btn-subtle" onClick={onClose} disabled={saving}>Скасувати</button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Збереження…" : mode === "create" ? "Створити авто" : "Зберегти зміни"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        show={imageToDelete !== null}
        title="Видалення фото"
        message="Видалити це фото?"
        confirmText="Видалити"
        onConfirm={performDeleteImage}
        onCancel={() => setImageToDelete(null)}
      />
    </>
  );
}
