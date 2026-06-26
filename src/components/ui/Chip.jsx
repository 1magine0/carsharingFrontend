/* Chip atom — filter/toggle pill. `active` drives the violet selected state. */
export function Chip({ active = false, className = "", children, ...rest }) {
  return (
    <button
      type="button"
      className={`chip ${className}`.trim()}
      data-active={active ? "true" : undefined}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Chip;
