import { useNavigate } from "react-router-dom";

import { getCurrentUser, logoutUser } from "../../services/authService";


// Temporary admin page. Users, orders and reports will be added later.
function AdminDashboard() {
    const navigate = useNavigate();
    const user = getCurrentUser();

    function handleLogout() {
        logoutUser();
        navigate("/login");
    }

    return (
        <div className="container py-5">
            <h1 className="fw-bold">Admin Dashboard</h1>
            <p className="text-muted">Welcome, {user.name}. You are logged in as admin.</p>

            <button className="btn btn-outline-dark" onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}

export default AdminDashboard;
