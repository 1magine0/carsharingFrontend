import { useEffect, useState } from "react";
import { getAdminRentalPhotosByTypeRequest } from "../api/adminRentalsApi";
import { safeHttpUrl } from "../utils/url";
import { Icons } from "./ui/Icons";

const MONTHS = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"];
const pad2 = (n) => String(n).padStart(2, "0");
function fmtDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/* Drivo-styled read-only viewer for a rental's before/after photos (admin).
   Behaviour unchanged — same adminRentalsApi endpoint + safeHttpUrl guard. */
export default function AdminRentalPhotosModal({ rentalId, photoType, onClose }) {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const isBefore = photoType === "BEFORE";

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setErrorMessage("");
            try {
                const data = await getAdminRentalPhotosByTypeRequest(rentalId, photoType);
                if (alive) setPhotos(data);
            } catch {
                if (alive) setErrorMessage("Не вдалося завантажити фото оренди");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [rentalId, photoType]);

    return (
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, zIndex: 70, display: "grid", placeItems: "center", padding: 20,
            background: "color-mix(in oklch, var(--bg) 30%, oklch(0.15 0.02 295 / 0.55))",
            backdropFilter: "blur(8px)", animation: "overlayIn .25s ease",
        }}>
            <div onClick={(e) => e.stopPropagation()} className="card" style={{
                width: "min(620px, 100%)", maxHeight: "92vh", overflow: "hidden",
                boxShadow: "var(--shadow-lg)", borderRadius: "var(--r-lg)",
                animation: "popIn .3s cubic-bezier(0.22,1,0.36,1)", display: "flex", flexDirection: "column",
            }}>
                {/* Header */}
                <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--text)" }}>
                            Фото «{isBefore ? "до" : "після"}»{!loading && ` · ${photos.length} шт.`}
                        </h2>
                        <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Оренда <span className="mono">#{rentalId}</span></div>
                    </div>
                    <button className="icon-btn" onClick={onClose} aria-label="Закрити"><Icons.Close size={18} /></button>
                </div>

                {/* Body */}
                <div style={{ padding: 20, overflowY: "auto" }}>
                    {errorMessage && (
                        <div style={{ marginBottom: 16, padding: "11px 14px", borderRadius: "var(--r-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13.5, fontWeight: 600 }}>{errorMessage}</div>
                    )}

                    {loading ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                            {[0, 1, 2].map((i) => <div key={i} className="skel" style={{ aspectRatio: "4/3", borderRadius: 10 }} />)}
                        </div>
                    ) : photos.length === 0 ? (
                        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, padding: "30px 0" }}>Фото цього типу ще не завантажені.</div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                            {photos.map((photo, index) => {
                                const url = safeHttpUrl(photo.imageUrl);
                                return (
                                    <a key={photo.id} href={url || undefined} target="_blank" rel="noreferrer"
                                        style={{ display: "block", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface-2)", textDecoration: "none" }}>
                                        {url ? (
                                            <img src={url} alt={`Фото ${isBefore ? "до" : "після"} №${index + 1}`} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
                                        ) : (
                                            <div className="img-ph" style={{ aspectRatio: "4/3" }}><span>{isBefore ? "до" : "після"} {index + 1}</span></div>
                                        )}
                                        <div style={{ padding: "7px 9px", fontSize: 11.5, color: "var(--text-faint)" }}>{fmtDateTime(photo.uploadedAt)}</div>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
                    <button className="btn btn-primary" onClick={onClose}>Готово</button>
                </div>
            </div>
        </div>
    );
}
