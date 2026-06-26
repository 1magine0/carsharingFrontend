import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCarsRequest } from "../api/carsApi";
import { isAdmin } from "../utils/auth";
import { useRealtime } from "../realtime/realtimeContext";
import { STATUS_META, FUEL_LABEL } from "../constants/labels";
import { Icons } from "../components/ui/Icons";
import { CarCard, CarCardSkeleton } from "../components/cars/CarCard";
import { SearchBar, ViewToggle, ActiveChips, EmptyState } from "../components/cars/CatalogControls";
import { FiltersPanel } from "../components/cars/FiltersPanel";
import { RentModal } from "../components/cars/RentModal";
import CarFormModal from "../components/cars/CarFormModal";
import CarsMap from "../components/CarsMap";
import {
  getCarCity, getCarPriceByTariff, getUniqueValues,
  yearBoundsOf, priceBoundsOf, loadFavourites, saveFavourites,
} from "../components/cars/carUtils";

const INITIAL_FILTERS = {
  search: "",
  status: [],
  tariff: "HOUR",
  brands: [],
  cities: [],
  fuels: [],
  year: null,  // null = full range (resolved against bounds)
  price: null,
};

export default function CarsPage() {
  const navigate = useNavigate();
  const admin = isAdmin();
  const { subscribe } = useRealtime();

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState("cards");
  const [favs, setFavs] = useState(() => loadFavourites());
  const [rentCar, setRentCar] = useState(null);
  const [adminModal, setAdminModal] = useState(null); // { mode, car } | null

  const loadCars = async () => {
    try {
      setCars(await getCarsRequest());
    } catch {
      toast.error("Не вдалося завантажити каталог авто");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void (async () => { await loadCars(); })(); }, []);

  // Live car-status updates (/topic/cars): patch the matching card in place so the
  // catalog reflects bookings / returns / admin edits without a reload.
  useEffect(() => {
    const off = subscribe("/topic/cars", ({ carId, status }) => {
      setCars((prev) => prev.map((c) => (c.id === carId ? { ...c, status } : c)));
    });
    return off;
  }, [subscribe]);

  // ---- Option sets + bounds ----
  const brands = useMemo(() => getUniqueValues(cars, (c) => c.brand), [cars]);
  const cities = useMemo(() => getUniqueValues(cars, (c) => getCarCity(c)), [cars]);
  const fuels = useMemo(() => getUniqueValues(cars, (c) => c.fuelType), [cars]);
  const yearBounds = useMemo(() => yearBoundsOf(cars), [cars]);
  const priceBounds = useMemo(() => priceBoundsOf(cars, filters.tariff), [cars, filters.tariff]);

  const yearValue = useMemo(() => filters.year ?? [yearBounds.min, yearBounds.max], [filters.year, yearBounds]);
  const priceValue = useMemo(() => filters.price ?? [priceBounds.min, priceBounds.max], [filters.price, priceBounds]);

  // ---- Filtering ----
  const filteredCars = useMemo(() => {
    const q = filters.search.toLowerCase().trim();
    const [yLo, yHi] = yearValue;
    const [pLo, pHi] = priceValue;

    return cars.filter((car) => {
      const matchesSearch = !q ||
        car.brand?.toLowerCase().includes(q) ||
        car.model?.toLowerCase().includes(q) ||
        car.registrationNumber?.toLowerCase().includes(q) ||
        car.color?.toLowerCase().includes(q) ||
        car.address?.toLowerCase().includes(q);

      const matchesStatus = filters.status.length === 0 || filters.status.includes(car.status);
      const matchesBrand = filters.brands.length === 0 || filters.brands.includes(car.brand);
      const matchesCity = filters.cities.length === 0 || filters.cities.includes(getCarCity(car));
      const matchesFuel = filters.fuels.length === 0 || filters.fuels.includes(car.fuelType);

      const year = Number(car.year);
      const matchesYear = Number.isNaN(year) || (year >= yLo && year <= yHi);

      const price = getCarPriceByTariff(car, filters.tariff);
      const matchesPrice = price >= pLo && price <= pHi;

      return matchesSearch && matchesStatus && matchesBrand && matchesCity && matchesFuel && matchesYear && matchesPrice;
    });
  }, [cars, filters, yearValue, priceValue]);

  // ---- Active chips + count ----
  const activeChips = useMemo(() => {
    const chips = [];
    const removeFrom = (group, value) =>
      setFilters((f) => ({ ...f, [group]: f[group].filter((x) => x !== value) }));
    filters.status.forEach((s) => chips.push({ key: `status:${s}`, label: STATUS_META[s]?.label || s, onRemove: () => removeFrom("status", s) }));
    filters.brands.forEach((b) => chips.push({ key: `brand:${b}`, label: b, onRemove: () => removeFrom("brands", b) }));
    filters.cities.forEach((c) => chips.push({ key: `city:${c}`, label: c, onRemove: () => removeFrom("cities", c) }));
    filters.fuels.forEach((f) => chips.push({ key: `fuel:${f}`, label: FUEL_LABEL[f] || f, onRemove: () => removeFrom("fuels", f) }));
    return chips;
  }, [filters]);

  const activeFilterCount =
    filters.status.length + filters.brands.length + filters.cities.length + filters.fuels.length +
    (filters.year ? 1 : 0) + (filters.price ? 1 : 0);

  // ---- Handlers ----
  const resetFilters = () => setFilters(INITIAL_FILTERS);
  const clearChips = () => setFilters((f) => ({ ...f, status: [], brands: [], cities: [], fuels: [] }));
  const handleTariffChange = (id) => setFilters((f) => ({ ...f, tariff: id, price: null }));

  const toggleFav = (id) => {
    setFavs((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id); else nextSet.add(id);
      saveFavourites(nextSet);
      return nextSet;
    });
  };

  // Pass the card through router-state so the details page can show fields the
  // CarDetailsResponse DTO omits (status / registrationNumber / city — Д7).
  const openCar = (car) => navigate(`/cars/${car.id}`, { state: { card: car } });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>Каталог авто</h1>
          <p style={{ margin: "5px 0 0", color: "var(--text-muted)", fontSize: 14.5 }}>
            Знайдено <b className="mono" style={{ color: "var(--text)" }}>{loading ? "…" : filteredCars.length}</b>
            {!loading && <> з <span className="mono">{cars.length}</span></>} авто
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ViewToggle view={view} onChange={setView} />
          {admin && (
            <button className="btn btn-primary" onClick={() => setAdminModal({ mode: "create" })}>
              <Icons.Plus size={17} sw={2.2} /> Додати авто
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <SearchBar
        value={filters.search}
        onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Active chips */}
      <ActiveChips chips={activeChips} onClearAll={clearChips} />

      {/* Content */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
          {Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)}
        </div>
      ) : filteredCars.length === 0 ? (
        <EmptyState onReset={resetFilters} />
      ) : view === "map" ? (
        <CarsMap cars={filteredCars} onRent={setRentCar} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
          {filteredCars.map((car, i) => (
            <CarCard
              key={car.id}
              car={car}
              index={i}
              fav={favs.has(car.id)}
              onToggleFav={toggleFav}
              onRent={setRentCar}
              onOpen={openCar}
              isAdmin={admin}
              onEdit={(c) => setAdminModal({ mode: "edit", car: c })}
            />
          ))}
        </div>
      )}

      {/* Filters sheet */}
      <FiltersPanel
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={{ ...filters, year: yearValue, price: priceValue }}
        setFilters={setFilters}
        options={{ brands, cities, fuels, yearBounds, priceBounds }}
        resultCount={filteredCars.length}
        onReset={resetFilters}
        onTariffChange={handleTariffChange}
      />

      {/* Rent modal */}
      {rentCar && (
        <RentModal
          car={rentCar}
          onClose={() => setRentCar(null)}
          onSuccess={loadCars}
          onDone={() => { setRentCar(null); navigate("/rentals"); }}
        />
      )}

      {/* Admin add/edit car (Drivo form — sends fuelType/transmission/seats) */}
      {admin && adminModal && (
        <CarFormModal
          mode={adminModal.mode}
          car={adminModal.car}
          onClose={() => setAdminModal(null)}
          onSaved={loadCars}
        />
      )}
    </div>
  );
}
