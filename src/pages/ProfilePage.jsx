import { useEffect, useState } from "react";
import { getCurrentUserRequest, updateCurrentUserRequest } from "../api/userApi";
import { getMyLicenseRequest, uploadLicenseRequest } from "../api/licensesApi";
import { getMyBonusBalanceRequest } from "../api/bonusesApi";

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [license, setLicense] = useState(null);
    const [bonusBalance, setBonusBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    const [editMode, setEditMode] = useState(false);
    const [profileForm, setProfileForm] = useState({
        fullName: "",
        email: "",
        phone: "",
    });

    const [formData, setFormData] = useState({
        documentNumber: "",
        issueDate: "",
        expiryDate: "",
        image: null,
    });

    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const loadData = async () => {
        setLoading(true);

        try {
            const userData = await getCurrentUserRequest();
            setUser(userData);
            setProfileForm({
                fullName: userData.fullName,
                email: userData.email,
                phone: userData.phone,
            });

            try {
                const bonusData = await getMyBonusBalanceRequest();
                setBonusBalance(Number(bonusData?.balance ?? 0));
            } catch {
                setBonusBalance(0);
            }

            try {
                const licenseData = await getMyLicenseRequest();
                setLicense(licenseData);
            } catch {
                setLicense(null);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const validateProfileForm = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[0-9]{10,15}$/;

        if (!profileForm.fullName.trim()) {
            return "Ім'я не може бути порожнім";
        }

        if (!emailRegex.test(profileForm.email)) {
            return "Некоректний формат email";
        }

        if (!phoneRegex.test(profileForm.phone)) {
            return "Телефон має містити 10-15 цифр і може починатися з +";
        }

        return null;
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;

        setProfileForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSaveProfile = async () => {
        setMessage("");
        setErrorMessage("");

        const validationError = validateProfileForm();
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        try {
            const updatedUser = await updateCurrentUserRequest(profileForm);
            setUser(updatedUser);
            setProfileForm({
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                phone: updatedUser.phone,
            });
            setEditMode(false);
            setMessage("Профіль успішно оновлено");
        } catch (error) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Не вдалося оновити профіль";

            setErrorMessage(backendMessage);
        }
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setErrorMessage("");
        setProfileForm({
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
        });
    };

    const handleLicenseChange = (e) => {
        const { name, value, files } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: name === "image" ? files[0] : value,
        }));
    };

    const handleUploadLicense = async (e) => {
        e.preventDefault();
        setMessage("");
        setErrorMessage("");

        try {
            await uploadLicenseRequest(formData);
            setMessage("Посвідчення успішно завантажене");
            await loadData();
        } catch (error) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Не вдалося завантажити посвідчення";

            setErrorMessage(backendMessage);
        }
    };

    if (loading) return <p>Завантаження...</p>;
    if (!user) return <p>Користувача не знайдено</p>;

    const showUploadForm = !license || license.status !== "APPROVED";

    return (
        <div className="row g-4">
            <div className="col-lg-6">
                <div className="card shadow-sm h-100">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-4">
                            <h2 className="card-title mb-0">Profile</h2>

                            {!editMode ? (
                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => setEditMode(true)}
                                >
                                    Edit
                                </button>
                            ) : (
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={handleSaveProfile}
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={handleCancelEdit}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {message && <div className="alert alert-success">{message}</div>}
                        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

                        {!editMode ? (
                            <>
                                <p><strong>Name:</strong> {user.fullName}</p>
                                <p><strong>Email:</strong> {user.email}</p>
                                <p><strong>Phone:</strong> {user.phone}</p>
                            </>
                        ) : (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Name</label>
                                    <input
                                        className="form-control"
                                        name="fullName"
                                        value={profileForm.fullName}
                                        onChange={handleProfileChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={profileForm.email}
                                        onChange={handleProfileChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Phone</label>
                                    <input
                                        className="form-control"
                                        name="phone"
                                        value={profileForm.phone}
                                        onChange={handleProfileChange}
                                    />
                                </div>
                            </>
                        )}

                        <p><strong>Status:</strong> {user.status}</p>
                        <p><strong>Referral code:</strong> {user.referralCode}</p>
                        <p><strong>Bonus balance:</strong> {bonusBalance}</p>
                    </div>
                </div>
            </div>

            <div className="col-lg-6">
                <div className="card shadow-sm">
                    <div className="card-body">
                        <h2 className="card-title mb-4">Driver License</h2>

                        {license ? (
                            <div className="mb-4">
                                <p><strong>Document number:</strong> {license.documentNumber}</p>
                                <p><strong>Status:</strong> {license.status}</p>
                                {license.rejectionReason && (
                                    <p><strong>Reject reason:</strong> {license.rejectionReason}</p>
                                )}
                                {license.imageUrl && (
                                    <div className="mb-3">
                                        <img
                                            src={license.imageUrl}
                                            alt="Driver license"
                                            className="img-fluid rounded border"
                                            style={{ maxHeight: "260px", objectFit: "cover" }}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="alert alert-secondary">
                                Посвідчення ще не завантажене
                            </div>
                        )}

                        {showUploadForm && (
                            <>
                                <h5 className="mb-3">
                                    {license ? "Upload new license data" : "Upload license"}
                                </h5>

                                <form onSubmit={handleUploadLicense}>
                                    <div className="mb-3">
                                        <label className="form-label">Document number</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="documentNumber"
                                            value={formData.documentNumber}
                                            onChange={handleLicenseChange}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Issue date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="issueDate"
                                            value={formData.issueDate}
                                            onChange={handleLicenseChange}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Expiry date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="expiryDate"
                                            value={formData.expiryDate}
                                            onChange={handleLicenseChange}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">License image</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            name="image"
                                            accept="image/*"
                                            onChange={handleLicenseChange}
                                            required
                                        />
                                    </div>

                                    <button className="btn btn-primary w-100">
                                        Upload license
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}