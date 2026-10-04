// Local dev sets VITE_API_BASE_URL (e.g. http://localhost:8000/api).
// On Vercel the backend shares the frontend's domain, so "/api" is enough.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";


// One helper for every backend call.
// It adds the JSON header, adds the token if we have one,
// and turns backend errors into a normal JavaScript Error.
// If body is URLSearchParams it is sent as a form instead (used by login).
export async function apiRequest(path, method = "GET", body = null) {
    const isForm = body instanceof URLSearchParams;

    const headers = {
        "Content-Type": isForm ? "application/x-www-form-urlencoded" : "application/json"
    };

    const token = localStorage.getItem("token");

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
        method: method,
        headers: headers
    };

    if (body) {
        options.body = isForm ? body : JSON.stringify(body);
    }

    let response;

    try {
        response = await fetch(API_BASE_URL + path, options);
    } catch {
        throw new Error("Cannot reach the server. Is the backend running?");
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(getErrorMessage(data));
    }

    return data;
}


// Sends a file (e.g. a food photo) as a form, not as JSON.
// No Content-Type header here: the browser adds the right one itself.
export async function apiUpload(path, file) {
    const formData = new FormData();
    formData.append("file", file);

    const headers = {};
    const token = localStorage.getItem("token");

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(API_BASE_URL + path, { method: "POST", headers: headers, body: formData });
    } catch {
        throw new Error("Cannot reach the server. Is the backend running?");
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(getErrorMessage(data));
    }

    return data;
}


// FastAPI sends errors in two shapes:
//   { "detail": "Some message" }            -> our own errors
//   { "detail": [ { "msg": "..." }, ... ] }  -> Pydantic validation errors
function getErrorMessage(data) {
    if (!data || !data.detail) {
        return "Something went wrong. Please try again.";
    }

    if (Array.isArray(data.detail)) {
        return data.detail[0].msg;
    }

    return data.detail;
}
