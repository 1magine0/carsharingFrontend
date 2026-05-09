import { useEffect, useState } from "react";
import {
    finishRentalRequest,
    getMyActiveRentalRequest,
    getMyRentalsRequest,
} from "../api/rentalsApi";
import RentalPhotosModal from "../components/RentalPhotosModal";
import { getRentalPhotosRequest } from "../api/rentalPhotosApi";
import {
    createMockPaymentRequest,
    mockPayRequest,
    createLiqPayPaymentRequest,
} from "../api/paymentsApi";

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

const submitLiqPayForm = ({ checkoutUrl, data, signature }) => {
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
    form.submit();
};

export default function RentalsPage() {
    const [rentals, setRentals] = useState([]);
    const [activeRental, setActiveRental] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [photosModal, setPhotosModal] = useState(null);
    const [activeRentalPhotos, setActiveRentalPhotos] = useState([]);
    const [paymentLoading, setPaymentLoading] = useState(false);

    const handleMockPayment = async (rentalId) => {
        setPaymentLoading(true);
        setMessage("");
        setErrorMessage("");

        try {
            const payment = await createMockPaymentRequest(rentalId);
            await mockPayRequest(payment.id);

            setMessage("Оплату виконано успішно");
            await loadData();
        } catch (error) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Не вдалося виконати оплату";

            setErrorMessage(backendMessage);
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleLiqPayPayment = async (rentalId) => {
        setPaymentLoading(true);
        setMessage("");
        setErrorMessage("");

        try {
            const checkoutData = await createLiqPayPaymentRequest(rentalId);
            submitLiqPayForm(checkoutData);
        } catch (error) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Не вдалося створити LiqPay платіж";

            setErrorMessage(backendMessage);
            setPaymentLoading(false);
        }
    };

    const loadActiveRentalPhotos = async (rentalId) => {
        if (!rentalId) {
            setActiveRentalPhotos([]);
            return;
        }

        try {
            const photos = await getRentalPhotosRequest(rentalId);
            setActiveRentalPhotos(photos);
        } catch (error) {
            setActiveRentalPhotos([]);
        }
    };

    const loadData = async () => {
        setLoading(true);
        setErrorMessage("");

        try {
            const rentalsData = await getMyRentalsRequest();
            setRentals(rentalsData);

            try {
                const activeData = await getMyActiveRentalRequest();
                setActiveRental(activeData);
                await loadActiveRentalPhotos(activeData.id);
            } catch (error) {
                setActiveRental(null);
                setActiveRentalPhotos([]);
            }
        } catch (error) {
            setErrorMessage("Не вдалося завантажити оренди");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleFinishRental = async (rentalId) => {
        setMessage("");
        setErrorMessage("");

        try {
            await finishRentalRequest(rentalId);
            setMessage("Оренду завершено успішно");
            await loadData();
        } catch (error) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Не вдалося завершити оренду";

            setErrorMessage(backendMessage);
        }
    };

    if (loading) {
        return <p>Завантаження...</p>;
    }
    const beforePhotos = activeRentalPhotos.filter((photo) => photo.photoType === "BEFORE");
    const afterPhotos = activeRentalPhotos.filter((photo) => photo.photoType === "AFTER");

    const hasBeforePhoto = beforePhotos.length > 0;
    const hasAfterPhoto = afterPhotos.length > 0;

    const bookedRentals = rentals.filter((rental) => rental.status === "BOOKED");
    const paidOrFinishedRentals = rentals.filter((rental) => rental.status !== "BOOKED");

    return (
        <div>
            <h2 className="mb-4">My Rentals</h2>

            {message && <div className="alert alert-success">{message}</div>}
            {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

            <div className="mb-4">
                <h4>Active Rental</h4>

                {activeRental ? (
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title">
                                {activeRental.carBrand} {activeRental.carModel}
                            </h5>
                            <p className="mb-1">
                                <strong>Registration:</strong> {activeRental.carRegistrationNumber}
                            </p>
                            <p className="mb-1">
                                <strong>Tariff:</strong> {activeRental.tariffType}
                            </p>
                            <p className="mb-1">
                                <strong>Start:</strong> {activeRental.startTime}
                            </p>
                            <p className="mb-1">
                                <strong>End:</strong> {activeRental.endTime}
                            </p>
                            <p className="mb-3">
                                <strong>Total:</strong> {activeRental.totalPrice} грн
                            </p>
                            <div className="row g-2 mb-3">
                                <div className="col-md-6">
                                    <button
                                        className={`btn w-100 ${
                                            hasBeforePhoto ? "btn-outline-success" : "btn-warning"
                                        }`}
                                        onClick={() =>
                                            setPhotosModal({
                                                rentalId: activeRental.id,
                                                photoType: "BEFORE",
                                            })
                                        }
                                    >
                                        {hasBeforePhoto
                                            ? `Before photos (${beforePhotos.length}/6)`
                                            : `Upload before photos (${beforePhotos.length}/6)`}
                                    </button>
                                </div>
                                {!hasBeforePhoto && (
                                    <div className="alert alert-warning">
                                        <strong>Потрібна дія перед початком оренди.</strong>
                                        <br />
                                        Завантажте хоча б одне фото авто до початку користування.
                                    </div>
                                )}

                                {hasBeforePhoto && !hasAfterPhoto && (
                                    <div className="alert alert-info">
                                        Фото до оренди завантажено. Перед завершенням оренди потрібно буде додати фото після.
                                    </div>
                                )}
                                <div className="col-md-6">
                                    <button
                                        className={`btn w-100 ${
                                            hasAfterPhoto ? "btn-outline-success" : "btn-outline-primary"
                                        }`}
                                        onClick={() =>
                                            setPhotosModal({
                                                rentalId: activeRental.id,
                                                photoType: "AFTER",
                                            })
                                        }
                                        disabled={!hasBeforePhoto}
                                    >
                                        After photos ({afterPhotos.length}/6)
                                    </button>

                                    {!hasBeforePhoto && (
                                        <div className="form-text text-muted">
                                            Спочатку завантажте фото до оренди.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                className="btn btn-danger"
                                disabled={!hasAfterPhoto}
                                onClick={() => handleFinishRental(activeRental.id)}
                            >
                                Finish Rental
                            </button>

                            {!hasAfterPhoto && (
                                <div className="form-text text-danger mt-2">
                                    Перед завершенням оренди потрібно додати хоча б одне фото після.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="alert alert-secondary mb-0">
                        Активної оренди немає
                    </div>
                )}
            </div>
            {bookedRentals.length > 0 && (
                <div className="card shadow-sm mb-4 border-warning">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h4 className="card-title mb-1 text-warning">
                                    Payment Required
                                </h4>
                                <p className="text-muted mb-0">
                                    У вас є оренда, яка очікує оплати. Після успішної оплати вона стане активною.
                                </p>
                            </div>

                            <span className="badge bg-warning text-dark">
                    {bookedRentals.length}
                </span>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-bordered align-middle mb-0">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Car</th>
                                    <th>Tariff</th>
                                    <th>Period</th>
                                    <th>Total price</th>
                                    <th>Bonus used</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                </tr>
                                </thead>

                                <tbody>
                                {bookedRentals.map((rental) => (
                                    <tr key={rental.id}>
                                        <td>{rental.id}</td>

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
                                    <span className="badge bg-warning text-dark">
                                        {rental.status}
                                    </span>
                                        </td>

                                        <td>
                                            <div className="d-grid gap-2">
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handleLiqPayPayment(rental.id)}
                                                    disabled={paymentLoading}
                                                >
                                                    {paymentLoading ? "Redirecting..." : "Pay with LiqPay"}
                                                </button>

                                                <button
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={() => handleMockPayment(rental.id)}
                                                    disabled={paymentLoading}
                                                >
                                                    Mock pay
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            <div>
                <h4>Rental History</h4>

                {paidOrFinishedRentals.length === 0 ? (
                    <div className="alert alert-secondary">Оренд поки немає</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-bordered align-middle">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Car</th>
                                <th>Tariff</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paidOrFinishedRentals.map((rental) => (
                                <tr key={rental.id}>
                                    <td>{rental.id}</td>
                                    <td>
                                        {rental.carBrand} {rental.carModel}
                                    </td>
                                    <td>{rental.tariffType}</td>
                                    <td>{rental.startTime}</td>
                                    <td>{rental.endTime}</td>
                                    <td>{rental.totalPrice} грн</td>
                                    <td>{rental.status}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {photosModal && (
                <RentalPhotosModal
                    rentalId={photosModal.rentalId}
                    photoType={photosModal.photoType}
                    onClose={() => setPhotosModal(null)}
                    onChanged={async () => {
                        await loadActiveRentalPhotos(photosModal.rentalId);
                    }}
                />
            )}
        </div>
    );
}