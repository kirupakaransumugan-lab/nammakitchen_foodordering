import { apiRequest } from "./api";


// cartItems = the items from CartContext
export function placeOrder(cartItems, deliveryAddress, phone) {
    return apiRequest("/orders", "POST", {
        // Only ids and quantities: the backend works out the prices itself
        items: cartItems.map((item) => ({
            food_id: item.id,
            quantity: item.quantity,
            option_ids: item.options.map((option) => option.id),
            note: item.note || null
        })),
        delivery_address: deliveryAddress,
        phone: phone
    });
}


// status: "" for all orders, or "Pending", "Delivered", ...
export function getMyOrders(status = "") {
    const query = status ? "?status=" + encodeURIComponent(status) : "";
    return apiRequest("/orders/my" + query);
}


export function getMyOrderById(orderId) {
    return apiRequest(`/orders/my/${orderId}`);
}


export function cancelMyOrder(orderId) {
    return apiRequest(`/orders/my/${orderId}/cancel`, "PATCH");
}
