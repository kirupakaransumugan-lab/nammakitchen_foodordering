import { ChefHat, CircleCheck, CircleX, Clock, Package, Truck } from "lucide-react";


// Same names as the backend (models/order.py), in the order they happen.
// "color" = the badge class, e.g. "order-status pending".
// "chartColor" = the slice colour in the owner's Order Status chart.
// The chart colours were checked to stay different for colour-blind people
// (and every slice also has a text label, so colour is never the only clue).
export const ORDER_STATUSES = [
    { value: "Pending", icon: Clock, color: "pending", chartColor: "#e8890c" },
    { value: "Confirmed", icon: CircleCheck, color: "confirmed", chartColor: "#1c7ed6" },
    { value: "Preparing", icon: ChefHat, color: "preparing", chartColor: "#2e9d5b" },
    { value: "Out for Delivery", icon: Truck, color: "delivery", chartColor: "#8a3ffc" },
    { value: "Delivered", icon: Package, color: "delivered", chartColor: "#0d9488" },
    { value: "Cancelled", icon: CircleX, color: "cancelled", chartColor: "#e03131" }
];


export function getStatusInfo(status) {
    return ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0];
}


// Button text for moving an order to "status"
const ACTION_LABELS = {
    Confirmed: "Confirm Order",
    Preparing: "Start Preparing",
    "Out for Delivery": "Mark as Out for Delivery",
    Delivered: "Mark as Delivered",
    Cancelled: "Cancel Order"
};

export function getActionLabel(status) {
    return ACTION_LABELS[status] || `Mark as ${status}`;
}
