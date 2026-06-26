import { initialsOf } from "./initials";

/* Avatar atom — accent circle with initials. Pass `initials` or `name`. */
export function Avatar({ initials, name, size = 36 }) {
  const text = initials ?? initialsOf(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "var(--accent)",
        color: "var(--accent-contrast)",
        fontWeight: 700,
        fontSize: size * 0.36,
        letterSpacing: "0.02em",
        boxShadow: "var(--shadow-accent)",
        flexShrink: 0,
      }}
    >
      {text}
    </div>
  );
}

export default Avatar;
