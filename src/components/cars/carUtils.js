import { FUEL_LABEL, TRANSMISSION_LABEL } from "../../constants/labels";

/* City: backend returns "TODO" placeholder for now — derive from the address. */
export function getCarCity(car) {
  if (car.city && car.city !== "TODO") return car.city;
  if (!car.address) return "Невідомо";
  return car.address.split(",")[0]?.trim() || "Невідомо";
}

export function getCarPriceByTariff(car, tariff) {
  switch (tariff) {
    case "DAY":
      return Number(car.pricePerDay || 0);
    case "MONTH":
      return Number(car.pricePerMonth || 0);
    case "HOUR":
    default:
      return Number(car.pricePerHour || 0);
  }
}

export const fuelLabel = (car) => FUEL_LABEL[car.fuelType] || car.fuelType || "—";
export const transmissionLabel = (car) => TRANSMISSION_LABEL[car.transmission] || car.transmission || "—";

export function getUniqueValues(cars, getter) {
  return [...new Set(cars.map(getter).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "uk"));
}

export function yearBoundsOf(cars) {
  const years = cars.map((c) => Number(c.year)).filter((y) => !Number.isNaN(y) && y > 0);
  if (years.length === 0) return { min: 2015, max: new Date().getFullYear() };
  return { min: Math.min(...years), max: Math.max(...years) };
}

export function priceBoundsOf(cars, tariff) {
  const prices = cars.map((c) => getCarPriceByTariff(c, tariff)).filter((p) => !Number.isNaN(p) && p > 0);
  if (prices.length === 0) return { min: 0, max: 1000 };
  return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}

/* ---- Favourites (no backend — localStorage, see Д5) ---- */
const FAV_KEY = "drivo-favourites";

export function loadFavourites() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY)) || []);
  } catch {
    return new Set();
  }
}

export function saveFavourites(set) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
}
