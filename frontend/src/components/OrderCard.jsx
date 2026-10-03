import { useState } from "react";
import { ArrowRight, CalendarDays, ChevronUp, Clock, MapPin, Phone } from "lucide-react";

import { formatDate, formatPrice, formatTime } from "../utils/format";
import StatusBadge from "./StatusBadge";

import "./Cards.css";
import "./OrderCard.css";


// How many items to show before "+ 2 more"
const ITEMS_PREVIEW = 3;


// One order on the My Orders page.
// "View Details" opens the card to show prices, address and the cancel button.
function OrderCard({ order, onCancel }) {
    const [open, setOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState("");

    // The first item's picture is the big picture on the left
    const coverImage = order.items.find((item) => item.food_image)?.food_image;

    const shownItems = open ? order.items : order.items.slice(0, ITEMS_PREVIEW);
    const hiddenCount = order.items.length - shownItems.length;


    async function handleCancel() {
        if (!window.confirm(`Cancel order #${order.id}?`)) {
            return;
        }

        setCancelling(true);
        setError("");

        try {
            await onCancel(order);
        } catch (err) {
            setError(err.message);
        } finally {
            setCancelling(false);
        }
    }


    return (
        <article className={open ? "order-card open" : "order-card"}>
            <div className="order-card-img">
                {coverImage ? (
                    <img src={coverImage} alt="" />
                ) : (
                    <span className="img-placeholder">
                        <i className="bi bi-bag"></i>
                    </span>
                )}
            </div>

            <div className="order-card-info">
                <h3 className="order-card-title">Order #{order.id}</h3>

                <p className="order-card-date">
                    <CalendarDays size={14} /> {formatDate(order.created_at)}
                    <span className="order-card-dot">•</span>
                    <Clock size={14} /> {formatTime(order.created_at)}
                </p>

                <ul className="order-card-items">
                    {shownItems.map((item) => (
                        <li key={item.id}>
                            {item.food_image ? (
                                <img src={item.food_image} alt="" />
                            ) : (
                                <span className="order-item-dot"></span>
                            )}
                            <span className="order-item-name">
                                {item.food_name}

                                {/* Picked size / toppings and the note, e.g. "Large, Extra Cheese · less spicy" */}
                                {open && (item.options.length > 0 || item.note) && (
                                    <small>
                                        {item.options.map((option) => option.option_name).join(", ")}
                                        {item.options.length > 0 && item.note && " · "}
                                        {item.note && <em>{item.note}</em>}
                                    </small>
                                )}
                            </span>
                            <span className="order-item-qty">× {item.quantity}</span>

                            {open && (
                                <span className="order-item-price">{formatPrice(item.subtotal)}</span>
                            )}
                        </li>
                    ))}
                </ul>

                {hiddenCount > 0 && (
                    <p className="order-card-more">+ {hiddenCount} more</p>
                )}

                {open && (
                    <div className="order-card-details">
                        <p><MapPin size={15} /> {order.delivery_address}</p>
                        <p><Phone size={15} /> {order.phone}</p>

                        {order.status === "Pending" && (
                            <button
                                type="button"
                                className="order-cancel-btn"
                                onClick={handleCancel}
                                disabled={cancelling}
                            >
                                {cancelling ? "Cancelling..." : "Cancel Order"}
                            </button>
                        )}

                        {error && <p className="order-card-error">{error}</p>}
                    </div>
                )}
            </div>

            <div className="order-card-side">
                <StatusBadge status={order.status} />

                <p className="order-card-total-label">Total Amount</p>
                <p className="order-card-total">{formatPrice(order.total_amount)}</p>
            </div>

            <div className="order-card-action">
                <button
                    type="button"
                    className="order-details-btn"
                    onClick={() => setOpen(!open)}
                    aria-expanded={open}
                >
                    {open ? (
                        <>Hide Details <ChevronUp size={18} /></>
                    ) : (
                        <>View Details <ArrowRight size={18} /></>
                    )}
                </button>
            </div>
        </article>
    );
}

export default OrderCard;
