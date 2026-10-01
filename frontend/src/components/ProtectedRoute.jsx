import { Navigate } from "react-router-dom";

import { getToken, getCurrentUser, getHomePathForRole } from "../services/authService";


// Wrap a page with this to make it "login only".
// allowedRoles example: ["admin"] or ["owner"]
function ProtectedRoute({ allowedRoles, children }) {
    const token = getToken();
    const user = getCurrentUser();

    // Not logged in -> go to login page
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Logged in, but wrong role -> go to their own home page
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={getHomePathForRole(user.role)} replace />;
    }

    return children;
}

export default ProtectedRoute;
