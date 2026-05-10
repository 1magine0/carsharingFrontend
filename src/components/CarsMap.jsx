import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function isValidCoordinate(value) {
    const number = Number(value);
    return !Number.isNaN(number) && number !== 0;
}

export default function CarsMap({ cars, onRent }) {
    const carsWithCoordinates = cars.filter(
        (car) => isValidCoordinate(car.latitude) && isValidCoordinate(car.longitude)
    );

    const kharkivCenter = [49.9935, 36.2304];

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h5 className="mb-1">Cars map</h5>
                        <p className="text-muted mb-0">
                            Авто на мапі: {carsWithCoordinates.length} / {cars.length}
                        </p>
                    </div>
                </div>

                <div
                    className="rounded overflow-hidden border"
                    style={{ height: "560px" }}
                >
                    <MapContainer
                        center={kharkivCenter}
                        zoom={12}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {carsWithCoordinates.map((car) => (
                            <Marker
                                key={car.id}
                                position={[Number(car.latitude), Number(car.longitude)]}
                            >
                                <Popup>
                                    <div style={{ minWidth: "220px" }}>
                                        <img
                                            src={
                                                car.imageUrl ||
                                                "https://via.placeholder.com/300x160?text=No+Image"
                                            }
                                            alt={`${car.brand} ${car.model}`}
                                            className="img-fluid rounded mb-2"
                                            style={{
                                                width: "100%",
                                                height: "120px",
                                                objectFit: "cover",
                                            }}
                                        />

                                        <h6 className="mb-1">
                                            {car.brand} {car.model}
                                        </h6>

                                        <div className="small text-muted mb-2">
                                            {car.address}
                                        </div>

                                        <div className="mb-1">
                                            <strong>Hourly:</strong> {car.pricePerHour} грн
                                        </div>

                                        <div className="mb-1">
                                            <strong>Daily:</strong> {car.pricePerDay} грн
                                        </div>

                                        <div className="mb-2">
                                            <strong>Status:</strong>{" "}
                                            <span
                                                className={
                                                    car.status === "AVAILABLE"
                                                        ? "text-success"
                                                        : "text-danger"
                                                }
                                            >
                                                {car.status}
                                            </span>
                                        </div>

                                        {car.status === "AVAILABLE" ? (
                                            <button
                                                className="btn btn-primary btn-sm w-100"
                                                onClick={() => onRent(car)}
                                            >
                                                Rent
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-secondary btn-sm w-100"
                                                disabled
                                            >
                                                Not available
                                            </button>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {carsWithCoordinates.length === 0 && (
                    <div className="alert alert-warning mt-3 mb-0">
                        Для відображення на мапі авто повинні мати latitude та longitude.
                    </div>
                )}
            </div>
        </div>
    );
}