import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/customer/Home";
import About from "./pages/customer/About";
import Foods from "./pages/customer/Foods";
import MyOrders from "./pages/customer/MyOrders";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import MenuManagement from "./pages/owner/MenuManagement";
import Customers from "./pages/owner/Customers";
import OwnerOrders from "./pages/owner/OwnerOrders";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import Reports from "./pages/admin/Reports";
import UserReports from "./pages/admin/UserReports";

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
                        path="/my-orders"
                        element={
                            <ProtectedRoute allowedRoles={["customer"]}>
                                <MyOrders />
                            </ProtectedRoute>
                        }
                    />

                    {/* Anyone can look at the menu */}
                    <Route path="/menu" element={<Foods />} />

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

                    <Route
                        path="/owner/menu"
                        element={
                            <ProtectedRoute allowedRoles={["owner"]}>
                                <MenuManagement />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/owner/customers"
                        element={
                            <ProtectedRoute allowedRoles={["owner"]}>
                                <Customers />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/owner/orders"
                        element={
                            <ProtectedRoute allowedRoles={["owner"]}>
                                <OwnerOrders />
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

                    <Route
                        path="/admin/users"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <Users />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/reports/restaurant"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <Reports />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/reports/users"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <UserReports />
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
