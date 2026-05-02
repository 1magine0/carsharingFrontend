import { useEffect, useRef, useState } from "react";
import {
    deleteRentalPhotoRequest,
    getRentalPhotosByTypeRequest,
    uploadRentalPhotoRequest,
} from "../api/rentalPhotosApi";

const MAX_PHOTOS = 6;

export default function RentalPhotosModal({ rentalId, photoType, onClose, onChanged }) {
    const fileInputRef = useRef(null);

    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const loadPhotos = async () => {
        setLoading(true);
        setErrorMessage("");

        try {
            const data = await getRentalPhotosByTypeRequest(rentalId, photoType);
            setPhotos(data);
        } catch (error) {
            setErrorMessage("Не вдалося завантажити фото");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPhotos();
    }, [rentalId, photoType]);

    const handleOpenFilePicker = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setUploading(true);
        setErrorMessage("");

        try {
            await uploadRentalPhotoRequest(rentalId, photoType, file);
            e.target.value = "";

            await loadPhotos();

            if (onChanged) {
                await onChanged();
            }
        } catch (error) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Не вдалося завантажити фото";

            setErrorMessage(backendMessage);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (photoId) => {
        const confirmed = window.confirm("Видалити це фото?");
        if (!confirmed) return;

        setErrorMessage("");

        try {
            await deleteRentalPhotoRequest(photoId);
            await loadPhotos();

            if (onChanged) {
                await onChanged();
            }
        } catch (error) {
            setErrorMessage("Не вдалося видалити фото");
        }
    };

    const canUploadMore = photos.length < MAX_PHOTOS;

    return (
        <>
            <div className="custom-backdrop" onClick={onClose}></div>

            <div className="custom-modal">
                <div className="custom-modal-dialog">
                    <div className="p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h3 className="mb-1">
                                    {photoType === "BEFORE" ? "Before photos" : "After photos"}
                                </h3>
                                <p className="text-muted mb-0">
                                    Фото: {photos.length} / {MAX_PHOTOS}
                                </p>
                            </div>

                            <button className="btn-close" onClick={onClose}></button>
                        </div>

                        {errorMessage && (
                            <div className="alert alert-danger">
                                {errorMessage}
                            </div>
                        )}

                        {loading ? (
                            <p>Завантаження...</p>
                        ) : (
                            <div className="row g-3">
                                {photos.map((photo) => (
                                    <div className="col-4" key={photo.id}>
                                        <div className="position-relative border rounded overflow-hidden">
                                            <img
                                                src={photo.imageUrl}
                                                alt={photo.photoType}
                                                style={{
                                                    width: "100%",
                                                    aspectRatio: "1 / 1",
                                                    objectFit: "cover",
                                                }}
                                            />

                                            <button
                                                type="button"
                                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                                                onClick={() => handleDelete(photo.id)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {canUploadMore && (
                                    <div className="col-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                                            style={{
                                                aspectRatio: "1 / 1",
                                                fontSize: "36px",
                                            }}
                                            onClick={handleOpenFilePicker}
                                            disabled={uploading}
                                        >
                                            {uploading ? "..." : "+"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="d-none"
                            onChange={handleFileChange}
                        />

                        <div className="d-flex justify-content-end mt-4">
                            <button className="btn btn-primary" onClick={onClose}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}