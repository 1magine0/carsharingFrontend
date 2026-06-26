import { createContext, useContext } from "react";

/* Theme context + hook live here (not in the .jsx) so the provider file
   only exports a component — keeps react-refresh / fast-refresh happy. */
export const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
