/* Car image: shows the real photo when present, else a striped placeholder
   labelled with brand+model (design `.img-ph`). */
export function CarPhoto({ car, height = 172, rounded = "16px 16px 0 0" }) {
  if (car.imageUrl) {
    return (
      <img
        src={car.imageUrl}
        alt={`${car.brand} ${car.model}`}
        style={{ height, width: "100%", objectFit: "cover", borderRadius: rounded, display: "block" }}
      />
    );
  }
  return (
    <div className="img-ph" style={{ height, borderRadius: rounded }}>
      <span>фото · {car.brand} {car.model}</span>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(120% 90% at 50% 120%, var(--accent-soft), transparent 60%)",
        opacity: 0.5, pointerEvents: "none",
      }} />
    </div>
  );
}

export default CarPhoto;
