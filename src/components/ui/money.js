/* Format a number with UA grouping (e.g. 24000 → "24 000"). */
export const money = (n) => Number(n ?? 0).toLocaleString("uk-UA");

export default money;
