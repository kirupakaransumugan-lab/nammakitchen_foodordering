import { useNavigate } from "react-router-dom";

import { getCurrentUser, logoutUser } from "../../services/authService";


// Temporary customer page. The food menu will be added here later.
function Home() {
    const navigate = useNavigate();
    const user = getCurrentUser();

    function handleLogout() {
        logoutUser();
        navigate("/login");
    }

    return (
        <div className="container py-5">
            <h1 className="fw-bold">Namma Kitchen</h1>
            <p className="text-muted">Welcome, {user.name}! The food menu is coming soon.</p>

            <button className="btn btn-outline-dark" onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}

export default Home;
