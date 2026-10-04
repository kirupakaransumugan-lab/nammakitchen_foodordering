import { apiRequest, apiUpload } from "./api";


// start / end: "2025-10-01" (both days included)
export function getDashboard(start, end) {
    return apiRequest(`/owner/dashboard?start=${start}&end=${end}`);
}


export function changeOrderStatus(orderId, status) {
    return apiRequest(`/owner/orders/${orderId}/status`, "PATCH", { status: status });
}


// Categories with how many foods each has
export function getOwnerCategories() {
    return apiRequest("/owner/categories");
}


// All foods, also the ones that are turned off
export function getOwnerFoods(filters = {}) {
    const params = new URLSearchParams();

    for (const key in filters) {
        if (filters[key] !== "" && filters[key] !== null && filters[key] !== undefined) {
            params.append(key, filters[key]);
        }
    }

    return apiRequest("/owner/foods?" + params.toString());
}


// ---------- Categories ----------

export function createCategory(data) {
    return apiRequest("/categories", "POST", data);
}

export function updateCategory(categoryId, data) {
    return apiRequest(`/categories/${categoryId}`, "PUT", data);
}

export function deleteCategory(categoryId) {
    return apiRequest(`/categories/${categoryId}`, "DELETE");
}


// ---------- Foods ----------

export function createFood(data) {
    return apiRequest("/foods", "POST", data);
}

export function updateFood(foodId, data) {
    return apiRequest(`/foods/${foodId}`, "PUT", data);
}

export function deleteFood(foodId) {
    return apiRequest(`/foods/${foodId}`, "DELETE");
}


// Photo from the owner's computer -> { url } to save as the food's "image"
export function uploadImage(file) {
    return apiUpload("/owner/uploads/image", file);
}


// ---------- Customers ----------

// Numbers for the cards at the top
export function getCustomerSummary() {
    return apiRequest("/owner/customers/summary");
}

// filters: { search, type, period, sort, page, limit }
export function getCustomers(filters = {}) {
    const params = new URLSearchParams();

    for (const key in filters) {
        if (filters[key] !== "" && filters[key] !== null && filters[key] !== undefined) {
            params.append(key, filters[key]);
        }
    }

    return apiRequest("/owner/customers?" + params.toString());
}

// One customer + their latest orders (ordersLimit of them)
export function getCustomerDetail(customerId, ordersLimit = 3) {
    return apiRequest(`/owner/customers/${customerId}?orders_limit=${ordersLimit}`);
}


// ---------- Orders page ----------

// filters: { status, search, start, end, page, limit }  (no dates = all orders)
export function getOwnerOrders(filters = {}) {
    const params = new URLSearchParams();

    for (const key in filters) {
        if (filters[key] !== "" && filters[key] !== null && filters[key] !== undefined) {
            params.append(key, filters[key]);
        }
    }

    return apiRequest("/owner/orders?" + params.toString());
}

export function getOwnerOrderDetail(orderId) {
    return apiRequest(`/owner/orders/${orderId}`);
}


// ---------- Reports ----------

// start / end: "2025-10-01" (both days included)
export function getOwnerReport(start, end) {
    return apiRequest(`/owner/reports?start=${start}&end=${end}`);
}


// ---------- Restaurant profile ----------

// Public details: name, contact, hours, "taking orders?"
export function getRestaurant() {
    return apiRequest("/restaurant");
}

export function updateRestaurant(data) {
    return apiRequest("/owner/restaurant", "PUT", data);
}

// false = customers can look at the menu but cannot order
export function setAcceptingOrders(isAccepting) {
    return apiRequest("/owner/restaurant/ordering", "PATCH", { is_accepting_orders: isAccepting });
}
