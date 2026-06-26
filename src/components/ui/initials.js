/* Derive up-to-2-letter initials from a full name ("Олександр Ткаченко" → "ОТ"). */
export function initialsOf(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
}

export default initialsOf;
