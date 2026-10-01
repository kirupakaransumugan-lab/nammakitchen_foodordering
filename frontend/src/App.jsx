import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/customer/Home";
import About from "./pages/customer/About";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

import { getCurrentUser, getHomePathForRole } from "./services/authService";


// When someone opens the website ("/"):
//   not logged in -> login page
//   logged in     -> their own home page (admin / owner / customer)
function StartPage() {
    const user = getCurrentUser();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Navigate to={getHomePathForRole(user.role)} replace />;
}


function App() {
    return (
        // CartProvider shares one cart with every page
        <CartProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<StartPage />} />

                    {/* Public pages */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Customer only */}
                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute allowedRoles={["customer"]}>
                                <Home />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/about"
                        element={<About />}
                    />

                    {/* Restaurant owner only */}
                    <Route
                        path="/owner"
                        element={
                            <ProtectedRoute allowedRoles={["owner"]}>
                                <OwnerDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin only */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Unknown URL -> start page */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </CartProvider>
    );
}

export default App;
