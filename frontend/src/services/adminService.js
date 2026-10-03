import { apiRequest } from "./api";


// { a: 1, b: "", c: null } -> "a=1" (empty filters are left out)
function toQuery(filters) {
    const params = new URLSearchParams();

    for (const key in filters) {
        if (filters[key] !== "" && filters[key] !== null && filters[key] !== undefined) {
            params.append(key, filters[key]);
        }
    }

    return params.toString();
}


export function getAdminOverview() {
    return apiRequest("/admin/overview");
}


// ---------- Users ----------

// filters: { search, role, active, sort, page, limit }
export function getAdminUsers(filters = {}) {
    return apiRequest("/admin/users?" + toQuery(filters));
}

export function getAdminUser(userId) {
    return apiRequest(`/admin/users/${userId}`);
}

export function setUserActive(userId, isActive) {
    return apiRequest(`/admin/users/${userId}/status`, "PATCH", { is_active: isActive });
}

export function setUserRole(userId, role) {
    return apiRequest(`/admin/users/${userId}/role`, "PATCH", { role: role });
}


// ---------- Reports (start / end: "2026-10-01", both days included) ----------

export function getRestaurantReport(start, end) {
    return apiRequest(`/admin/reports/restaurant?start=${start}&end=${end}`);
}

export function getUserReport(start, end) {
    return apiRequest(`/admin/reports/users?start=${start}&end=${end}`);
}

// filters: { area: "restaurant" | "user" | "admin", user_id, search, start, end, page, limit }
export function getActivity(filters = {}) {
    return apiRequest("/admin/activity?" + toQuery(filters));
}
