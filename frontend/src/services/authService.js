import { apiRequest } from "./api";


export function registerUser(userData) {
    return apiRequest("/auth/register", "POST", userData);
}


export async function loginUser(email, password) {
    // OAuth2 password flow: send a form, and the email goes in "username"
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);

    const data = await apiRequest("/auth/login", "POST", form);

    // Save the token and user, so they stay after a page refresh
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data.user;
}


// name, phone, address of the logged-in user (email and role stay the same)
export async function updateMyAccount(data) {
    const user = await apiRequest("/auth/me", "PUT", data);

    // Keep the saved copy in step, so the top bar shows the new name
    localStorage.setItem("user", JSON.stringify(user));

    return user;
}


export function changePassword(currentPassword, newPassword) {
    return apiRequest("/auth/me/password", "PUT", {
        current_password: currentPassword,
        new_password: newPassword
    });
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
