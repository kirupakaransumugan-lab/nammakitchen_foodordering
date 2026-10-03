// 1800 -> "Rs. 1,800"
export function formatPrice(amount) {
    return "Rs. " + Number(amount).toLocaleString("en-US");
}


// "2025-10-01T18:30:00" or "2025-10-01" -> "01 Oct 2025"
export function formatDate(dateText) {
    // A date without a time is read as UTC midnight, which can show the
    // day before in some time zones. Adding a time makes it local.
    const text = String(dateText).length === 10 ? dateText + "T00:00:00" : dateText;

    return new Date(text).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// "2025-10-01T18:30:00" -> "06:30 PM"
export function formatTime(dateText) {
    return new Date(dateText).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });
}


// "Spice Hub" -> "SH"
export function initials(name) {
    return String(name)
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join("");
}


// WhatsApp needs the number with the country code and digits only.
// Local Sri Lankan numbers start with 0: "077 123 4567" -> "94771234567"
export function whatsappLink(phone) {
    let digits = String(phone).replace(/\D/g, "");
    if (digits.startsWith("0")) digits = "94" + digits.slice(1);
    return `https://wa.me/${digits}`;
}


// 12 -> "#NK00012" (how the restaurant shows order numbers)
export function formatOrderId(id) {
    return "#NK" + String(id).padStart(5, "0");
}


// "2026-10-03T12:40:00" -> "just now" / "5 min ago" / "3 h ago" / "2 days ago" / "01 Oct 2026"
export function timeAgo(dateText) {
    const seconds = Math.floor((Date.now() - new Date(dateText).getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
    if (seconds < 7 * 86400) {
        const days = Math.floor(seconds / 86400);
        return `${days} ${days === 1 ? "day" : "days"} ago`;
    }
    return formatDate(dateText);
}
