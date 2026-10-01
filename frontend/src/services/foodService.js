import { apiRequest } from "./api";


// filters example: { search: "pizza", category_id: 1, sort: "price", order: "asc", page: 1 }
export function getFoods(filters = {}) {
    const params = new URLSearchParams();

    // Only send the filters that have a value
    for (const key in filters) {
        if (filters[key] !== "" && filters[key] !== null && filters[key] !== undefined) {
            params.append(key, filters[key]);
        }
    }

    return apiRequest("/foods?" + params.toString());
}


export function getPopularFoods(limit = 4) {
    return apiRequest(`/foods/popular?limit=${limit}`);
}


export function getFoodById(foodId) {
    return apiRequest(`/foods/${foodId}`);
}
