import { Link, Outlet, useNavigate } from "react-router-dom";
import { isAdmin, isAuthenticated, removeAuthData } from "../utils/auth";

export default function MainLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        removeAuthData();
        navigate("/login");
    };

    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container">
                    <Link className="navbar-brand" to="/">
                        Carsharing
                    </Link>

                    <div className="collapse navbar-collapse show">
                        <ul className="navbar-nav me-auto">
                            <li className="nav-item">
                                <Link className="nav-link" to="/">
                                    Cars
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/rentals">
                                    My Rentals
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/profile">
                                    Profile
                                </Link>
                            </li>

                            {isAdmin() && (
                                <li className="nav-item">
                                    <Link className="nav-link" to="/admin/licenses">
                                        Admin Licenses
                                    </Link>
                                </li>
                            )}
                        </ul>

                        {isAuthenticated() && (
                            <button className="btn btn-outline-light" onClick={handleLogout}>
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            <main className="container py-4">
                <Outlet />
            </main>
        </>
    );
}