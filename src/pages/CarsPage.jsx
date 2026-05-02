import { useEffect, useMemo, useState } from "react";
import { getCarsRequest } from "../api/carsApi";
import { getMyBonusBalanceRequest } from "../api/bonusesApi";
import { createRentalRequest, previewRentalRequest } from "../api/rentalsApi";
import { useNavigate } from "react-router-dom";
import { isAdmin } from "../utils/auth";
import {
    createCarRequest,
    updateCarRequest,
    uploadCarImageRequest,
    getCarImagesRequest,
    setMainCarImageRequest,
    deleteCarImageRequest,
} from "../api/adminCarsApi";

const initialFormState = {
    tariffType: "HOUR",
    startTime: "",
    endTime: "",
    bonusUsed: "0",
};

const initialCarForm = {
    brand: "",
    model: "",
    year: "",
    registrationNumber: "",
    color: "",
    pricePerHour: "",
    pricePerDay: "",
    pricePerMonth: "",
    status: "AVAILABLE",
    address: "",
    latitude: "",
    longitude: "",
};

function formatMoney(value) {
    if (value === null || value === undefined) return "-";
    return `${value} грн`;
}

export default function CarsPage() {
    const [carModalMode, setCarModalMode] = useState(null);
    const [carForm, setCarForm] = useState(initialCarForm);
    const [carFormError, setCarFormError] = useState("");
    const [editingCarId, setEditingCarId] = useState(null);

    const [carImageFile, setCarImageFile] = useState(null);
    const [carImageIsMain, setCarImageIsMain] = useState(true);
    const [carImages, setCarImages] = useState([]);
    const [carImagesLoading, setCarImagesLoading] = useState(false);

    const navigate = useNavigate();

    const [cars, setCars] = useState([]);
    const [bonusBalance, setBonusBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    const [selectedCar, setSelectedCar] = useState(null);
    const [formData, setFormData] = useState(initialFormState);
    const [preview, setPreview] = useState(null);

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [previewError, setPreviewError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [carsData, bonusData] = await Promise.all([
                    getCarsRequest(),
                    getMyBonusBalanceRequest(),
                ]);

                setCars(carsData);
                setBonusBalance(Number(bonusData?.balance ?? 0));
            } catch (error) {
                setErrorMessage("Не вдалося завантажити дані сторінки");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        if (selectedCar) {
            document.body.classList.add("modal-open");
        } else {
            document.body.classList.remove("modal-open");
        }

        return () => document.body.classList.remove("modal-open");
    }, [selectedCar]);

    const loadCarImages = async (carId) => {
        if (!carId) return;

        setCarImagesLoading(true);

        try {
            const images = await getCarImagesRequest(carId);
            setCarImages(images);
        } catch (error) {
            setCarImages([]);
        } finally {
            setCarImagesLoading(false);
        }
    };

    const openCreateCarModal = () => {
        setCarModalMode("create");
        setEditingCarId(null);
        setCarForm(initialCarForm);
        setErrorMessage("");
        setSuccessMessage("");
        setCarImageFile(null);
        setCarImageIsMain(true);
    };

    const openEditCarModal = async (car) => {
        setCarModalMode("edit");
        setEditingCarId(car.id);
        setCarForm({
            brand: car.brand || "",
            model: car.model || "",
            year: car.year || "",
            registrationNumber: car.registrationNumber || "",
            color: car.color || "",
            pricePerHour: car.pricePerHour || "",
            pricePerDay: car.pricePerDay || "",
            pricePerMonth: car.pricePerMonth || "",
            status: car.status || "AVAILABLE",
            address: car.address || "",
            latitude: car.latitude || "",
            longitude: car.longitude || "",
        });

        setCarImageFile(null);
        setCarImageIsMain(false);
        setCarFormError("");
        setCarImages([]);

        await loadCarImages(car.id);
    };

    const closeCarModal = () => {
        setCarModalMode(null);
        setEditingCarId(null);
        setCarForm(initialCarForm);
        setCarImageFile(null);
        setCarImageIsMain(true);
        setCarImages([]);
    };

    const handleCarFormChange = (e) => {
        const { name, value } = e.target;

        setCarForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const normalizeCarPayload = () => ({
        brand: carForm.brand,
        model: carForm.model,
        year: Number(carForm.year),
        registrationNumber: carForm.registrationNumber,
        color: carForm.color,
        pricePerHour: Number(carForm.pricePerHour),
        pricePerDay: Number(carForm.pricePerDay),
        pricePerMonth: Number(carForm.pricePerMonth),
        status: carForm.status,
        address: carForm.address,
        latitude: Number(carForm.latitude),
        longitude: Number(carForm.longitude),
    });

    const handleSaveCar = async () => {
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const payload = normalizeCarPayload();

            let savedCar;

            if (carModalMode === "create") {
                savedCar = await createCarRequest(payload);
                setSuccessMessage("Авто створено");
            } else {
                savedCar = await updateCarRequest(editingCarId, payload);
                setSuccessMessage("Авто оновлено");
            }

            const targetCarId = carModalMode === "create" ? savedCar.id : editingCarId;

            if (carImageFile) {
                await uploadCarImageRequest(targetCarId, carImageFile, carImageIsMain);
            }
            if (carModalMode === "edit") {
                await loadCarImages(targetCarId);
            }
            closeCarModal();

            const updatedCars = await getCarsRequest();
            setCars(updatedCars);
        } catch (error) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Не вдалося зберегти авто";

            setErrorMessage(backendMessage);
        }
    };

    const handleUploadCarImage = async () => {
        if (!editingCarId || !carImageFile) {
            setCarFormError("Оберіть фото для завантаження");
            return;
        }

        setCarFormError("");

        try {
            await uploadCarImageRequest(editingCarId, carImageFile, carImageIsMain);

            setCarImageFile(null);
            setCarImageIsMain(false);

            await loadCarImages(editingCarId);

            const updatedCars = await getCarsRequest();
            setCars(updatedCars);
        } catch (error) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Не вдалося завантажити фото авто";

            setCarFormError(backendMessage);
        }
    };

    const handleSetMainImage = async (imageId) => {
        setCarFormError("");

        try {
            await setMainCarImageRequest(imageId);
            await loadCarImages(editingCarId);

            const updatedCars = await getCarsRequest();
            setCars(updatedCars);
        } catch (error) {
            setCarFormError("Не вдалося зробити фото головним");
        }
    };

    const handleDeleteCarImage = async (imageId) => {
        const confirmed = window.confirm("Видалити це фото?");
        if (!confirmed) return;

        setCarFormError("");

        try {
            await deleteCarImageRequest(imageId);
            await loadCarImages(editingCarId);

            const updatedCars = await getCarsRequest();
            setCars(updatedCars);
        } catch (error) {
            setCarFormError("Не вдалося видалити фото");
        }
    };

    const openRentalModal = (car) => {
        setSelectedCar(car);
        setFormData(initialFormState);
        setPreview(null);
        setPreviewError("");
        setSuccessMessage("");
        setErrorMessage("");
    };

    const closeRentalModal = () => {
        setSelectedCar(null);
        setFormData(initialFormState);
        setPreview(null);
        setPreviewError("");
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const canPreview = useMemo(() => {
        return (
            selectedCar &&
            formData.tariffType &&
            formData.startTime &&
            formData.endTime
        );
    }, [selectedCar, formData]);

    useEffect(() => {
        const loadPreview = async () => {
            if (!canPreview || !selectedCar) {
                setPreview(null);
                setPreviewError("");
                return;
            }

            setPreviewLoading(true);
            setPreviewError("");

            try {
                const previewData = await previewRentalRequest({
                    carId: selectedCar.id,
                    tariffType: formData.tariffType,
                    startTime: formData.startTime,
                    endTime: formData.endTime,
                });

                setPreview(previewData);

                const maxBonus = Number(previewData.maxBonusUsage ?? 0);
                const currentBonus = Number(formData.bonusUsed || 0);

                if (currentBonus > maxBonus) {
                    setFormData((prev) => ({
                        ...prev,
                        bonusUsed: String(maxBonus),
                    }));
                }
            } catch (error) {
                setPreview(null);
                const backendMessage =
                    error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    "Не вдалося розрахувати оренду";

                setPreviewError(backendMessage);
            } finally {
                setPreviewLoading(false);
            }
        };

        loadPreview();
    }, [canPreview, selectedCar, formData.tariffType, formData.startTime, formData.endTime]);

    const maxBonusUsage = Number(preview?.maxBonusUsage ?? 0);
    const enteredBonus = Number(formData.bonusUsed || 0);

    const finalPrice = useMemo(() => {
        if (!preview) return null;

        const base = Number(preview.basePrice ?? 0);
        const bonus = Math.min(Math.max(enteredBonus, 0), maxBonusUsage);

        return Math.max(base - bonus, 0).toFixed(2);
    }, [preview, enteredBonus, maxBonusUsage]);

    const handleBonusSliderChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            bonusUsed: e.target.value,
        }));
    };

    const handleBonusTextChange = (e) => {
        const value = e.target.value;

        if (value === "") {
            setFormData((prev) => ({
                ...prev,
                bonusUsed: "",
            }));
            return;
        }

        const parsed = Number(value);

        if (Number.isNaN(parsed)) return;

        setFormData((prev) => ({
            ...prev,
            bonusUsed: String(parsed),
        }));
    };

    const handleCreateRental = async () => {
        if (!selectedCar) return;

        setSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const safeBonus = Math.min(Math.max(Number(formData.bonusUsed || 0), 0), maxBonusUsage);

            await createRentalRequest({
                carId: selectedCar.id,
                tariffType: formData.tariffType,
                startTime: formData.startTime,
                endTime: formData.endTime,
                bonusUsed: Number(safeBonus.toFixed(2)),
            });

            setSuccessMessage("Оренду створено успішно");
            closeRentalModal();
            navigate("/rentals");
        } catch (error) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Не вдалося створити оренду";

            setErrorMessage(backendMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <p>Завантаження...</p>;
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Available cars</h2>

                <div className="d-flex gap-2 align-items-center">
                    <div className="badge bg-success fs-6">
                        Бонуси: {bonusBalance}
                    </div>

                    {isAdmin() && (
                        <button className="btn btn-outline-primary" onClick={openCreateCarModal}>
                            Add car
                        </button>
                    )}
                </div>
            </div>

            {successMessage && (
                <div className="alert alert-success">{successMessage}</div>
            )}

            {errorMessage && (
                <div className="alert alert-danger">{errorMessage}</div>
            )}

            <div className="row g-4">
                {cars.map((car) => (
                    <div className="col-md-6 col-lg-4" key={car.id}>
                        <div className="card h-100 shadow-sm">
                            <img
                                src={
                                    car.imageUrl ||
                                    "https://via.placeholder.com/400x220?text=No+Image"
                                }
                                className="card-img-top"
                                alt={`${car.brand} ${car.model}`}
                                style={{ height: "220px", objectFit: "cover" }}
                            />

                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title">
                                    {car.brand} {car.model}
                                </h5>

                                <p className="card-text mb-1">
                                    <strong>Address:</strong> {car.address}
                                </p>

                                <p className="card-text mb-1">
                                    <strong>Hourly:</strong> {car.pricePerHour} грн
                                </p>

                                <p className="card-text mb-1">
                                    <strong>Daily:</strong> {car.pricePerDay} грн
                                </p>

                                <p className="card-text mb-2">
                                    <strong>Monthly:</strong> {car.pricePerMonth} грн
                                </p>

                                <p className="mb-3">
                                    <strong>Status:</strong>{" "}
                                    <span className={car.status === "AVAILABLE" ? "text-success" : "text-danger"}>
                                        {car.status}
                                    </span>
                                </p>

                                <div className="mt-auto">
                                    {isAdmin() && (
                                        <button
                                            className="btn btn-outline-warning w-100 mb-2"
                                            onClick={() => openEditCarModal(car)}
                                        >
                                            Edit car
                                        </button>
                                    )}

                                    {car.status === "AVAILABLE" ? (
                                        <button
                                            className="btn btn-primary w-100"
                                            onClick={() => openRentalModal(car)}
                                        >
                                            Rent
                                        </button>
                                    ) : (
                                        <button className="btn btn-secondary w-100" disabled>
                                            Not available
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedCar && (
                <>
                    <div className="custom-backdrop" onClick={closeRentalModal}></div>

                    <div className="custom-modal">
                        <div className="custom-modal-dialog">
                            <div className="p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h3 className="mb-1">
                                            Rent {selectedCar.brand} {selectedCar.model}
                                        </h3>
                                        <p className="text-muted mb-0">{selectedCar.address}</p>
                                    </div>

                                    <button
                                        className="btn-close"
                                        onClick={closeRentalModal}
                                    ></button>
                                </div>

                                {previewError && (
                                    <div className="alert alert-danger">{previewError}</div>
                                )}

                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="form-label">Tariff</label>
                                        <select
                                            className="form-select"
                                            name="tariffType"
                                            value={formData.tariffType}
                                            onChange={handleInputChange}
                                        >
                                            <option value="HOUR">HOUR</option>
                                            <option value="DAY">DAY</option>
                                            <option value="MONTH">MONTH</option>
                                        </select>
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">Start time</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            name="startTime"
                                            value={formData.startTime}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">End time</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            name="endTime"
                                            value={formData.endTime}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-3">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <p className="mb-2">
                                                <strong>Base price:</strong>{" "}
                                                {preview ? formatMoney(preview.basePrice) : "-"}
                                            </p>
                                            <p className="mb-2">
                                                <strong>Your bonus balance:</strong>{" "}
                                                {preview ? preview.availableBonusBalance : bonusBalance}
                                            </p>
                                            <p className="mb-2">
                                                <strong>Max usable bonus:</strong>{" "}
                                                {preview ? preview.maxBonusUsage : "-"}
                                            </p>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <p className="mb-2">
                                                        <strong>Final price:</strong>
                                                    </p>
                                                    <div className="fs-4 fw-bold text-success">
                                                        {finalPrice !== null ? `${finalPrice} грн` : "-"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        Bonus to use
                                    </label>

                                    <input
                                        type="range"
                                        className="form-range"
                                        min="0"
                                        max={maxBonusUsage}
                                        step="0.01"
                                        value={Math.min(Math.max(Number(formData.bonusUsed || 0), 0), maxBonusUsage)}
                                        onChange={handleBonusSliderChange}
                                        disabled={!preview || previewLoading}
                                    />

                                    <div className="row g-2">
                                        <div className="col-md-6">
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="0"
                                                max={maxBonusUsage}
                                                step="0.01"
                                                value={formData.bonusUsed}
                                                onChange={handleBonusTextChange}
                                                disabled={!preview || previewLoading}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-control bg-light">
                                                Обрано бонусів:{" "}
                                                {Math.min(
                                                    Math.max(Number(formData.bonusUsed || 0), 0),
                                                    maxBonusUsage
                                                ).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-2 mt-4">
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={closeRentalModal}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className="btn btn-primary"
                                        onClick={handleCreateRental}
                                        disabled={!preview || previewLoading || submitting}
                                    >
                                        {submitting ? "Creating..." : "Confirm rental"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
            {carModalMode && (
                <>
                    <div className="custom-backdrop" onClick={closeCarModal}></div>

                    <div className="custom-modal">
                        <div className="custom-modal-dialog">
                            <div className="p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <h3 className="mb-0">
                                        {carModalMode === "create" ? "Add car" : "Edit car"}
                                    </h3>

                                    <button className="btn-close" onClick={closeCarModal}></button>
                                </div>

                                {carFormError && (
                                    <div className="alert alert-danger">
                                        {carFormError}
                                    </div>
                                )}

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Brand</label>
                                        <input
                                            className="form-control"
                                            name="brand"
                                            value={carForm.brand}
                                            onChange={handleCarFormChange}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Model</label>
                                        <input
                                            className="form-control"
                                            name="model"
                                            value={carForm.model}
                                            onChange={handleCarFormChange}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">Year</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="year"
                                            value={carForm.year}
                                            onChange={handleCarFormChange}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">Color</label>
                                        <input
                                            className="form-control"
                                            name="color"
                                            value={carForm.color}
                                            onChange={handleCarFormChange}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            name="status"
                                            value={carForm.status}
                                            onChange={handleCarFormChange}
                                        >
                                            <option value="AVAILABLE">AVAILABLE</option>
                                            <option value="RENTED">RENTED</option>
                                            <option value="SERVICE">SERVICE</option>
                                            <option value="INACTIVE">INACTIVE</option>
                                        </select>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Registration number</label>
                                        <input
                                            className="form-control"
                                            name="registrationNumber"
                                            value={carForm.registrationNumber}
                                            onChange={handleCarFormChange}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Address</label>
                                        <input
                                            className="form-control"
                                            name="address"
                                            value={carForm.address}
                                            onChange={handleCarFormChange}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Latitude</label>
                                        <input
                                            type="number"
                                            step="0.0000001"
                                            className="form-control"
                                            name="latitude"
                                            value={carForm.latitude}
                                            onChange={handleCarFormChange}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Longitude</label>
                                        <input
                                            type="number"
                                            step="0.0000001"
                                            className="form-control"
                                            name="longitude"
                                            value={carForm.longitude}
                                            onChange={handleCarFormChange}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">Price per hour</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            name="pricePerHour"
                                            value={carForm.pricePerHour}
                                            onChange={handleCarFormChange}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">Price per day</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            name="pricePerDay"
                                            value={carForm.pricePerDay}
                                            onChange={handleCarFormChange}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">Price per month</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            name="pricePerMonth"
                                            value={carForm.pricePerMonth}
                                            onChange={handleCarFormChange}
                                        />
                                    </div>

                                    <div className="col-12">
                                        <hr />
                                        <h5 className="mb-3">Car image</h5>
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label">Upload image</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={(e) => setCarImageFile(e.target.files[0])}
                                        />
                                    </div>

                                    <div className="col-12">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={carImageIsMain}
                                                onChange={(e) => setCarImageIsMain(e.target.checked)}
                                                id="isMainImage"
                                            />
                                            <label className="form-check-label" htmlFor="isMainImage">
                                                Make this image main
                                            </label>
                                        </div>
                                    </div>

                                    {carModalMode === "edit" && (
                                        <div className="col-12">
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary"
                                                onClick={handleUploadCarImage}
                                                disabled={!carImageFile}
                                            >
                                                Upload image
                                            </button>
                                        </div>
                                    )}

                                    {carModalMode === "edit" && (
                                        <div className="col-12">
                                            <hr />

                                            <h5 className="mb-3">Car images</h5>

                                            {carImagesLoading ? (
                                                <p>Завантаження фото...</p>
                                            ) : carImages.length === 0 ? (
                                                <div className="alert alert-secondary">
                                                    Фото ще не додані
                                                </div>
                                            ) : (
                                                <div className="row g-3">
                                                    {carImages.map((image) => (
                                                        <div className="col-md-4" key={image.id}>
                                                            <div className="card h-100">
                                                                <img
                                                                    src={image.imageUrl}
                                                                    alt="Car"
                                                                    className="card-img-top"
                                                                    style={{
                                                                        height: "140px",
                                                                        objectFit: "cover",
                                                                    }}
                                                                />

                                                                <div className="card-body p-2">
                                                                    {image.isMain && (
                                                                        <span className="badge bg-success mb-2">
                                                                Main
                                                            </span>
                                                                    )}

                                                                    <div className="d-grid gap-2">
                                                                        {!image.isMain && (
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-outline-primary btn-sm"
                                                                                onClick={() => handleSetMainImage(image.id)}
                                                                            >
                                                                                Set main
                                                                            </button>
                                                                        )}

                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-outline-danger btn-sm"
                                                                            onClick={() => handleDeleteCarImage(image.id)}
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="d-flex justify-content-end gap-2 mt-4">
                                    <button className="btn btn-outline-secondary" onClick={closeCarModal}>
                                        Cancel
                                    </button>

                                    <button className="btn btn-primary" onClick={handleSaveCar}>
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}