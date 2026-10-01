const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


// One helper for every backend call.
// It adds the JSON header, adds the token if we have one,
// and turns backend errors into a normal JavaScript Error.
export async function apiRequest(path, method = "GET", body = null) {
    const headers = {
        "Content-Type": "application/json"
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
        options.body = JSON.stringify(body);
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
