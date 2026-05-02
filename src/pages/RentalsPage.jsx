import { useEffect, useState } from "react";
import {
    finishRentalRequest,
    getMyActiveRentalRequest,
    getMyRentalsRequest,
} from "../api/rentalsApi";

export default function RentalsPage() {
    const [rentals, setRentals] = useState([]);
    const [activeRental, setActiveRental] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const loadData = async () => {
        setLoading(true);
        setErrorMessage("");

        try {
            const rentalsData = await getMyRentalsRequest();
            setRentals(rentalsData);

            try {
                const activeData = await getMyActiveRentalRequest();
                setActiveRental(activeData);
            } catch (error) {
                setActiveRental(null);
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

                            <button
                                className="btn btn-danger"
                                onClick={() => handleFinishRental(activeRental.id)}
                            >
                                Finish Rental
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="alert alert-secondary mb-0">
                        Активної оренди немає
                    </div>
                )}
            </div>

            <div>
                <h4>Rental History</h4>

                {rentals.length === 0 ? (
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
                            {rentals.map((rental) => (
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
        </div>
    );
}