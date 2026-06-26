import { STATUS_META } from "../../constants/labels";

/* Status badge. Resolves a {label, cls} from a meta map.
   - `map`    : which meta map to use (default CarStatus = STATUS_META).
   - `status` : key into that map.
   Pass RENTAL_STATUS_META / USER_STATUS_META / LICENSE_STATUS_META for other domains. */
export function StatusBadge({ status, map = STATUS_META, size = "md", className = "" }) {
  const m = map[status] || { label: status ?? "—", cls: "badge--inactive" };
  const style = size === "sm" ? { fontSize: 11, padding: "3px 8px" } : undefined;
  return (
    <span className={`badge ${m.cls} ${className}`.trim()} style={style}>
      <span className="dot" />
      {m.label}
    </span>
  );
}

export default StatusBadge;
