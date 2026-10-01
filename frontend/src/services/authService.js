import { apiRequest } from "./api";


export function registerUser(userData) {
    return apiRequest("/auth/register", "POST", userData);
}


export async function loginUser(email, password) {
    const data = await apiRequest("/auth/login", "POST", {
        email: email,
        password: password
    });

    // Save the token and user, so they stay after a page refresh
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data.user;
}


export function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}


export function getToken() {
    return localStorage.getItem("token");
}


export function getCurrentUser() {
    const user = localStorage.getItem("user");

    if (!user) {
        return null;
    }

    return JSON.parse(user);
}


// Where each role goes after login
export function getHomePathForRole(role) {
    if (role === "admin") {
        return "/admin";
    }

    if (role === "owner") {
        return "/owner";
    }

    return "/home";
}
