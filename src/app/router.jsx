import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import CarsPage from "../pages/CarsPage";
import CarDetailsPage from "../pages/CarDetailsPage";
import ProfilePage from "../pages/ProfilePage";
import RentalsPage from "../pages/RentalsPage";
import AdminLicensesPage from "../pages/AdminLicensesPage";
import MainLayout from "../components/MainLayout";
import { isAdmin, isAuthenticated } from "../utils/auth";
import RegisterPage from "../pages/RegisterPage";
import AdminRentalsPage from "../pages/AdminRentalsPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";

function PrivateRoute({ children }) {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    if (!isAdmin()) {
        return <Navigate to="/" replace />;
    }
    return children;
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <MainLayout />
                        </PrivateRoute>
                    }
                >
                    <Route index element={<CarsPage />} />
                    <Route path="cars/:id" element={<CarDetailsPage />} />
                    <Route path="rentals" element={<RentalsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route
                        path="admin/licenses"
                        element={
                            <AdminRoute>
                                <AdminLicensesPage />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="admin/rentals"
                        element={
                            <AdminRoute>
                                <AdminRentalsPage />
                            </AdminRoute>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
