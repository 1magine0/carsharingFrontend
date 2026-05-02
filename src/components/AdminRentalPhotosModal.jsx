import { useEffect, useState } from "react";
import { getAdminRentalPhotosByTypeRequest } from "../api/adminRentalsApi";

function formatDateTime(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString("uk-UA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AdminRentalPhotosModal({ rentalId, photoType, onClose }) {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const loadPhotos = async () => {
            setLoading(true);
            setErrorMessage("");

            try {
                const data = await getAdminRentalPhotosByTypeRequest(rentalId, photoType);
                setPhotos(data);
            } catch (error) {
                setErrorMessage("Не вдалося завантажити фото оренди");
            } finally {
                setLoading(false);
            }
        };

        loadPhotos();
    }, [rentalId, photoType]);

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
                                    Rental ID: {rentalId}
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
                        ) : photos.length === 0 ? (
                            <div className="alert alert-secondary mb-0">
                                Фото цього типу ще не завантажені
                            </div>
                        ) : (
                            <div className="row g-3">
                                {photos.map((photo) => (
                                    <div className="col-md-4" key={photo.id}>
                                        <div className="card h-100">
                                            <img
                                                src={photo.imageUrl}
                                                alt={photo.photoType}
                                                className="card-img-top"
                                                style={{
                                                    height: "170px",
                                                    objectFit: "cover",
                                                }}
                                            />

                                            <div className="card-body p-2">
                                                <div className="small text-muted">
                                                    {formatDateTime(photo.uploadedAt)}
                                                </div>

                                                <a
                                                    href={photo.imageUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn btn-sm btn-outline-primary w-100 mt-2"
                                                >
                                                    Open full size
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="d-flex justify-content-end mt-4">
                            <button className="btn btn-primary" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}