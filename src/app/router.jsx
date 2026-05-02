import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import CarsPage from "../pages/CarsPage";
import ProfilePage from "../pages/ProfilePage";
import RentalsPage from "../pages/RentalsPage";
import AdminLicensesPage from "../pages/AdminLicensesPage";
import MainLayout from "../components/MainLayout";
import { isAuthenticated } from "../utils/auth";
import RegisterPage from "../pages/RegisterPage";

function PrivateRoute({ children }) {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <MainLayout />
                        </PrivateRoute>
                    }
                >
                    <Route index element={<CarsPage />} />
                    <Route path="rentals" element={<RentalsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="admin/licenses" element={<AdminLicensesPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}