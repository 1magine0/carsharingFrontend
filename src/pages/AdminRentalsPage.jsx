import { useEffect, useState } from "react";
import {
    getAdminActiveRentalsRequest,
    getAdminRentalsRequest,
} from "../api/adminRentalsApi";
import AdminRentalPhotosModal from "../components/AdminRentalPhotosModal";

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

function getStatusBadgeClass(status) {
    switch (status) {
        case "ACTIVE":
            return "bg-success";
        case "FINISHED":
            return "bg-secondary";
        case "CANCELED":
            return "bg-danger";
        case "BOOKED":
            return "bg-primary";
        default:
            return "bg-dark";
    }
}

export default function AdminRentalsPage() {
    const [rentals, setRentals] = useState([]);
    const [mode, setMode] = useState("ACTIVE");
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [photosModal, setPhotosModal] = useState(null);

    const loadRentals = async (selectedMode = mode) => {
        setLoading(true);
        setErrorMessage("");

        try {
            const data =
                selectedMode === "ACTIVE"
                    ? await getAdminActiveRentalsRequest()
                    : await getAdminRentalsRequest();

            setRentals(data);
        } catch (error) {
            setErrorMessage("Не вдалося завантажити оренди");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRentals("ACTIVE");
    }, []);

    const handleModeChange = async (newMode) => {
        setMode(newMode);
        await loadRentals(newMode);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Admin Rentals</h2>
                    <p className="text-muted mb-0">
                        Перегляд активних та історичних оренд користувачів
                    </p>
                </div>

                <button
                    className="btn btn-outline-primary"
                    onClick={() => loadRentals(mode)}
                    disabled={loading}
                >
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {errorMessage && (
                <div className="alert alert-danger">{errorMessage}</div>
            )}

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="btn-group" role="group">
                        <button
                            className={`btn ${
                                mode === "ACTIVE"
                                    ? "btn-primary"
                                    : "btn-outline-primary"
                            }`}
                            onClick={() => handleModeChange("ACTIVE")}
                        >
                            Active rentals
                        </button>

                        <button
                            className={`btn ${
                                mode === "ALL"
                                    ? "btn-primary"
                                    : "btn-outline-primary"
                            }`}
                            onClick={() => handleModeChange("ALL")}
                        >
                            All rentals
                        </button>
                    </div>

                    <div className="mt-3 text-muted">
                        Знайдено оренд: {rentals.length}
                    </div>
                </div>
            </div>

            {loading && rentals.length === 0 ? (
                <p>Завантаження...</p>
            ) : rentals.length === 0 ? (
                <div className="alert alert-secondary">
                    Оренд за вибраним режимом немає
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped table-bordered align-middle">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Contacts</th>
                            <th>Car</th>
                            <th>Tariff</th>
                            <th>Period</th>
                            <th>Total</th>
                            <th>Bonus</th>
                            <th>Before photos</th>
                            <th>After photos</th>
                            <th>Status</th>
                        </tr>
                        </thead>

                        <tbody>
                        {rentals.map((rental) => (
                            <tr key={rental.id}>
                                <td>{rental.id}</td>

                                <td>
                                    <div className="fw-semibold">
                                        {rental.userFullName}
                                    </div>
                                    <div className="text-muted small">
                                        ID: {rental.userId}
                                    </div>
                                </td>

                                <td>
                                    <div>
                                        <strong>Email:</strong>{" "}
                                        <a href={`mailto:${rental.userEmail}`}>
                                            {rental.userEmail}
                                        </a>
                                    </div>

                                    <div>
                                        <strong>Phone:</strong>{" "}
                                        <a href={`tel:${rental.userPhone}`}>
                                            {rental.userPhone}
                                        </a>
                                    </div>
                                </td>

                                <td>
                                    <div className="fw-semibold">
                                        {rental.carBrand} {rental.carModel}
                                    </div>
                                    <div className="text-muted small">
                                        {rental.carRegistrationNumber}
                                    </div>
                                </td>

                                <td>{rental.tariffType}</td>

                                <td>
                                    <div>
                                        <strong>Start:</strong>{" "}
                                        {formatDateTime(rental.startTime)}
                                    </div>
                                    <div>
                                        <strong>End:</strong>{" "}
                                        {formatDateTime(rental.endTime)}
                                    </div>
                                </td>

                                <td>{rental.totalPrice} грн</td>

                                <td>{rental.bonusUsed} бонусів</td>
                                <td>
                                    <button
                                        className={`btn btn-sm w-100 ${
                                            rental.beforePhotoCount > 0
                                                ? "btn-outline-success"
                                                : "btn-outline-secondary"
                                        }`}
                                        onClick={() =>
                                            setPhotosModal({
                                                rentalId: rental.id,
                                                photoType: "BEFORE",
                                            })
                                        }
                                    >
                                        Before ({rental.beforePhotoCount ?? 0})
                                    </button>
                                </td>

                                <td>
                                    <button
                                        className={`btn btn-sm w-100 ${
                                            rental.afterPhotoCount > 0
                                                ? "btn-outline-success"
                                                : "btn-outline-secondary"
                                        }`}
                                        onClick={() =>
                                            setPhotosModal({
                                                rentalId: rental.id,
                                                photoType: "AFTER",
                                            })
                                        }
                                    >
                                        After ({rental.afterPhotoCount ?? 0})
                                    </button>
                                </td>
                                <td>
                                        <span
                                            className={`badge ${getStatusBadgeClass(
                                                rental.status
                                            )}`}
                                        >
                                            {rental.status}
                                        </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
            {photosModal && (
                <AdminRentalPhotosModal
                    rentalId={photosModal.rentalId}
                    photoType={photosModal.photoType}
                    onClose={() => setPhotosModal(null)}
                />
            )}
        </div>
    );
}