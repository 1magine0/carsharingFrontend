import { useEffect, useRef, useState } from "react";
import {
    deleteRentalPhotoRequest,
    getRentalPhotosByTypeRequest,
    uploadRentalPhotoRequest,
} from "../api/rentalPhotosApi";
import { Icons } from "./ui/Icons";
import ConfirmModal from "./ConfirmModal";

const MAX_PHOTOS = 6;

/* Drivo-styled before/after photo manager for a rental (Phase 6 restyle).
   Behaviour unchanged — same rentalPhotosApi endpoints + ConfirmModal delete. */
export default function RentalPhotosModal({ rentalId, photoType, onClose, onChanged }) {
    const fileInputRef = useRef(null);

    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [photoToDelete, setPhotoToDelete] = useState(null);

    const loadPhotos = async () => {
        setLoading(true);
        setErrorMessage("");
        try {
            setPhotos(await getRentalPhotosByTypeRequest(rentalId, photoType));
        } catch {
            setErrorMessage("Не вдалося завантажити фото");
        } finally {
            setLoading(false);
        }
    };

    // setState lives inside the async IIFE (react-hooks/set-state-in-effect).
    useEffect(() => {
        void (async () => { await loadPhotos(); })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rentalId, photoType]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setErrorMessage("");
        try {
            await uploadRentalPhotoRequest(rentalId, photoType, file);
            e.target.value = "";
            await loadPhotos();
            await onChanged?.();
        } catch (error) {
            setErrorMessage(error?.response?.data?.message || error?.response?.data?.error || "Не вдалося завантажити фото");
        } finally {
            setUploading(false);
        }
    };

    const performDelete = async () => {
        const photoId = photoToDelete;
        setPhotoToDelete(null);
        setErrorMessage("");
        try {
            await deleteRentalPhotoRequest(photoId);
            await loadPhotos();
            await onChanged?.();
        } catch {
            setErrorMessage("Не вдалося видалити фото");
        }
    };

    const canUploadMore = photos.length < MAX_PHOTOS;
    const isBefore = photoType === "BEFORE";

    return (
        <>
            <div onClick={onClose} style={{
                position: "fixed", inset: 0, zIndex: 70, display: "grid", placeItems: "center", padding: 20,
                background: "color-mix(in oklch, var(--bg) 30%, oklch(0.15 0.02 295 / 0.55))",
                backdropFilter: "blur(8px)", animation: "overlayIn .25s ease",
            }}>
                <div onClick={(e) => e.stopPropagation()} className="card" style={{
                    width: "min(560px, 100%)", maxHeight: "92vh", overflow: "hidden",
                    boxShadow: "var(--shadow-lg)", borderRadius: "var(--r-lg)",
                    animation: "popIn .3s cubic-bezier(0.22,1,0.36,1)", display: "flex", flexDirection: "column",
                }}>
                    {/* Header */}
                    <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Фотофіксація</div>
                            <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
                                {isBefore ? "Фото «до» оренди" : "Фото «після» оренди"}
                            </h2>
                            <div style={{ marginTop: 4, fontSize: 13, color: "var(--text-muted)" }}>Завантажено {photos.length} / {MAX_PHOTOS}</div>
                        </div>
                        <button className="icon-btn" onClick={onClose} aria-label="Закрити"><Icons.Close size={18} /></button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "20px 24px", overflowY: "auto" }}>
                        {errorMessage && (
                            <div style={{ marginBottom: 16, padding: "11px 14px", borderRadius: "var(--r-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13.5, fontWeight: 600 }}>{errorMessage}</div>
                        )}

                        {loading ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                                {[0, 1, 2].map((i) => <div key={i} className="skel" style={{ aspectRatio: "1/1", borderRadius: "var(--r-md)" }} />)}
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                                {photos.map((photo, index) => (
                                    <div key={photo.id} style={{ position: "relative", borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--border)" }}>
                                        <img src={photo.imageUrl} alt={`Фото ${isBefore ? "до" : "після"} №${index + 1}`}
                                            style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                                        <button type="button" className="icon-btn" aria-label="Видалити фото" onClick={() => setPhotoToDelete(photo.id)}
                                            style={{ position: "absolute", top: 6, right: 6, background: "var(--surface)", width: 30, height: 30 }}>
                                            <Icons.Trash size={15} />
                                        </button>
                                    </div>
                                ))}
                                {canUploadMore && (
                                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                                        style={{ aspectRatio: "1/1", borderRadius: "var(--r-md)", border: "1.5px dashed var(--border-strong)", background: "var(--surface)", color: "var(--text-muted)", cursor: uploading ? "default" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                        {uploading ? <span style={{ fontSize: 13 }}>Завантаження…</span> : <><Icons.Plus size={26} /><span style={{ fontSize: 12.5 }}>Додати</span></>}
                                    </button>
                                )}
                            </div>
                        )}

                        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />
                    </div>

                    {/* Footer */}
                    <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
                        <button className="btn btn-primary" onClick={onClose}>Готово</button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                show={photoToDelete !== null}
                title="Видалення фото"
                message="Видалити це фото?"
                confirmText="Видалити"
                onConfirm={performDelete}
                onCancel={() => setPhotoToDelete(null)}
            />
        </>
    );
}
