import { Icons } from "./Icons";
import { useTheme } from "../../theme/themeContext";

/* ThemeToggle atom — self-contained; reads/sets theme via ThemeProvider. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      className="icon-btn"
      onClick={toggleTheme}
      aria-label="Перемкнути тему"
      title={dark ? "Світла тема" : "Темна тема"}
    >
      {dark ? <Icons.Sun size={19} /> : <Icons.Moon size={18} />}
    </button>
  );
}

export default ThemeToggle;
