/* Central UA label maps + enum metadata.
   Aligned to backend enums — keep keys in sync with:
   CarStatus, RentalStatus, TariffType, UserStatus, LicenseStatus, FuelType, Transmission. */

/* CarStatus → badge meta */
export const STATUS_META = {
  AVAILABLE: { label: "Доступне", cls: "badge--available" },
  RESERVED: { label: "Заброньоване", cls: "badge--reserved" },
  RENTED: { label: "В оренді", cls: "badge--rented" },
  SERVICE: { label: "Сервіс", cls: "badge--service" },
  INACTIVE: { label: "Неактивне", cls: "badge--inactive" },
};

/* RentalStatus → badge meta */
export const RENTAL_STATUS_META = {
  BOOKED: { label: "Очікує оплати", cls: "badge--rented" },
  ACTIVE: { label: "Активна", cls: "badge--available" },
  FINISHED: { label: "Завершена", cls: "badge--inactive" },
  CANCELED: { label: "Скасована", cls: "badge--reserved" },
  EXPIRED: { label: "Час вийшов", cls: "badge--service" },
};

/* TariffType → UA */
export const TARIFF_LABEL = {
  HOUR: "Погодинно",
  DAY: "Подобово",
  MONTH: "Помісячно",
};

/* UserStatus → badge meta */
export const USER_STATUS_META = {
  ACTIVE: { label: "Активний", cls: "badge--available" },
  PENDING: { label: "На перевірці", cls: "badge--reserved" },
  BLOCKED: { label: "Заблокований", cls: "badge--inactive" },
};

/* LicenseStatus → badge meta */
export const LICENSE_STATUS_META = {
  PENDING: { label: "На перевірці", cls: "badge--reserved" },
  APPROVED: { label: "Підтверджене", cls: "badge--available" },
  REJECTED: { label: "Відхилене", cls: "badge--inactive" },
};

/* FuelType → UA */
export const FUEL_LABEL = {
  PETROL: "Бензин",
  DIESEL: "Дизель",
  ELECTRIC: "Електро",
  HYBRID: "Гібрид",
  GAS: "Газ",
};

/* Transmission → UA */
export const TRANSMISSION_LABEL = {
  MANUAL: "Механіка",
  AUTOMATIC: "Автомат",
};

/* Helper: resolve a label from a map with safe fallback to the raw key. */
export const labelOf = (map, key) => map?.[key]?.label ?? map?.[key] ?? key ?? "";
