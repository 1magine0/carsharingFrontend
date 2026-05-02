import { useEffect, useState } from "react";
import {
    approveLicenseRequest,
    getPendingLicensesRequest,
    rejectLicenseRequest,
} from "../api/licensesApi";

export default function AdminLicensesPage() {
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const loadLicenses = async () => {
        setLoading(true);
        try {
            const data = await getPendingLicensesRequest();
            setLicenses(data);
        } catch (error) {
            setErrorMessage("Не вдалося завантажити pending licenses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLicenses();
    }, []);

    const handleApprove = async (id) => {
        setMessage("");
        setErrorMessage("");

        try {
            await approveLicenseRequest(id);
            setMessage("Посвідчення підтверджено");
            await loadLicenses();
        } catch (error) {
            setErrorMessage("Не вдалося підтвердити посвідчення");
        }
    };

    const handleReject = async (id) => {
        const reason = prompt("Введи причину відхилення");
        if (!reason) return;

        setMessage("");
        setErrorMessage("");

        try {
            await rejectLicenseRequest(id, reason);
            setMessage("Посвідчення відхилено");
            await loadLicenses();
        } catch (error) {
            setErrorMessage("Не вдалося відхилити посвідчення");
        }
    };

    if (loading && licenses.length === 0) return <p>Завантаження...</p>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Pending Driver Licenses</h2>

                <button
                    className="btn btn-outline-primary"
                    onClick={loadLicenses}
                    disabled={loading}
                >
                    {loading && (
                        <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                        ></span>
                    )}
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

            {licenses.length === 0 ? (
                <div className="alert alert-secondary">Немає посвідчень на перевірку</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-bordered table-striped">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Document Number</th>
                            <th>Document Photo</th>
                            <th>Status</th>
                            <th>Reject reason</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {licenses.map((license) => (
                            <tr key={license.id}>
                                <td>{license.id}</td>
                                <td>{license.documentNumber}</td>
                                <td>{license.imageUrl && (
                                    <div className="mb-3">
                                        <img
                                            src={license.imageUrl}
                                            alt="Driver license"
                                            className="img-fluid rounded border"
                                            style={{ maxHeight: "130px", objectFit: "cover" }}
                                        />
                                    </div>
                                )}</td>
                                <td>{license.status}</td>
                                <td>{license.rejectionReason || "-"}</td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleApprove(license.id)}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleReject(license.id)}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}