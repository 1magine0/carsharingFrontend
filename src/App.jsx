import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppRouter from "./app/router";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useTheme } from "./theme/themeContext";
import { RealtimeProvider } from "./realtime/RealtimeProvider";

/* Toast container that follows the active Drivo theme. */
function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme={theme}
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <RealtimeProvider>
        <div className="app-bg" />
        <AppRouter />
        <ThemedToaster />
      </RealtimeProvider>
    </ThemeProvider>
  );
}

export default App;
