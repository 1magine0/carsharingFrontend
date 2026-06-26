import axios from "axios";
import { toast } from "react-toastify";
import { removeAuthData } from "../utils/auth";

const axiosClient = axios.create({
    // FE-3: relative base — the Vite dev proxy (and a same-origin prod deploy)
    // forward /api to the backend, so the HttpOnly auth cookie travels with every
    // request. Override with VITE_API_URL for a cross-origin prod backend.
    baseURL: import.meta.env.VITE_API_URL ?? "/api",
    // Send the auth cookie on every request (required once it's cross-origin).
    withCredentials: true,
});

// FE-3: no request interceptor adds Authorization anymore — the JWT lives in an
// HttpOnly cookie the browser attaches automatically, out of reach of JS/XSS.

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url ?? "";
        // Login/register failures must be shown inline by the page,
        // not as a session-expired redirect.
        const isAuthEndpoint = url.startsWith("/auth/");

        if (error.code === "ERR_NETWORK") {
            toast.error("Немає з'єднання з сервером");
        } else if (status === 401 && !isAuthEndpoint) {
            removeAuthData();
            toast.warn("Сесія закінчилась. Будь ласка, увійдіть знову.");
            window.location.assign("/login");
        } else if (status === 403) {
            toast.error("Доступ заборонено");
        } else if (status >= 500) {
            toast.error("Помилка сервера. Спробуйте пізніше.");
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
