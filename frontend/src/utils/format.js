// 1800 -> "Rs. 1,800"
export function formatPrice(amount) {
    return "Rs. " + Number(amount).toLocaleString("en-US");
}
