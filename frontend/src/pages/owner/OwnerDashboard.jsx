import { useNavigate } from "react-router-dom";

import { getCurrentUser, logoutUser } from "../../services/authService";


// Temporary owner page. Categories, foods and orders will be added later.
function OwnerDashboard() {
    const navigate = useNavigate();
    const user = getCurrentUser();

    function handleLogout() {
        logoutUser();
        navigate("/login");
    }

    return (
        <div className="container py-5">
            <h1 className="fw-bold">Owner Dashboard</h1>
            <p className="text-muted">Welcome, {user.name}. You are logged in as restaurant owner.</p>

            <button className="btn btn-outline-dark" onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}

export default OwnerDashboard;
