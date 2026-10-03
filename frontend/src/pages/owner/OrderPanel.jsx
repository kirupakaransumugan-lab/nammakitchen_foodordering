import { useState } from "react";
import {
    CalendarDays,
    Clock,
    Crown,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    ShoppingBag,
    Banknote,
    X
} from "lucide-react";

import { Avatar } from "./CustomerPanel";
import { useLoad } from "./useLoad";
import StatusBadge from "../../components/StatusBadge";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import { getCustomerDetail, getOwnerOrderDetail } from "../../services/ownerService";
import { formatDate, formatOrderId, formatPrice, formatTime, whatsappLink } from "../../utils/format";
import { getActionLabel } from "../../utils/orderStatus";


// Name, email, totals of the person who ordered (loads only when the tab is opened)
function CustomerInfo({ customerId, reload }) {
    const detail = useLoad(() => getCustomerDetail(customerId), `${customerId}|${reload}`);
    const c = detail.data;

    if (detail.error) return <ErrorMessage message={detail.error} />;
    if (!c) return <Loading message="Loading customer..." />;

    return (
        <>
            {c.is_vip && <p><span className="cust-vip"><Crown size={13} /> VIP Customer</span></p>}

            <ul className="order-info">
                <li><Phone size={17} /><span>{c.phone}</span></li>
                <li><Mail size={17} /><span>{c.email}</span></li>
                <li><MapPin size={17} /><span>{c.address || "No address saved"}</span></li>
                <li><CalendarDays size={17} /><span>Member since {formatDate(c.created_at)}</span></li>
            </ul>

            <div className="cust-tiles">
                <div className="cust-tile">
                    <ShoppingBag size={20} />
                    <span><strong>{c.orders}</strong><small>Total Orders</small></span>
                </div>
                <div className="cust-tile">
                    <Banknote size={20} />
                    <span><strong>{formatPrice(c.total_spent)}</strong><small>Total Spent</small></span>
                </div>
            </div>
        </>
    );
}


// The right side of the Orders page: one order.
//   onChangeStatus(order, status): the page changes it, then reloads
function OrderPanel({ orderId, reload, busy, onChangeStatus, onClose }) {
    const [tab, setTab] = useState("details");

    const detail = useLoad(() => getOwnerOrderDetail(orderId), `${orderId}|${reload}`);
    const order = detail.data;
    const ready = order && order.id === orderId;

    // Forward steps get the orange button, "Cancelled" the red outline one
    const nextSteps = ready ? order.next_statuses.filter((s) => s !== "Cancelled") : [];
    const canCancel = ready && order.next_statuses.includes("Cancelled");


    return (
        <>
            <div className="order-panel-head">
                <h2>Order {formatOrderId(orderId)}</h2>
                {ready && <StatusBadge status={order.status} size={13} />}
                <button type="button" className="cust-panel-close" onClick={onClose} aria-label="Close">
                    <X size={20} />
                </button>
            </div>

            {!ready && detail.loading && <Loading message="Loading order..." />}
            {detail.error && <ErrorMessage message={detail.error} />}

            {ready && (
                <>
                    {/* ---------- Who ordered ---------- */}
                    <div className="order-customer">
                        {order.customer ? <Avatar customer={order.customer} /> : <span className="cust-avatar c0">?</span>}
                        <div>
                            <strong>{order.customer ? order.customer.name : "Deleted user"}</strong>
                            <small>{order.phone}</small>
                        </div>
                        <div className="cust-contact-btns">
                            <a href={`tel:${order.phone}`} className="call" aria-label="Call customer" title="Call">
                                <Phone size={17} />
                            </a>
                            <a
                                href={whatsappLink(order.phone)}
                                target="_blank"
                                rel="noreferrer"
                                className="chat"
                                aria-label="WhatsApp customer"
                                title="WhatsApp"
                            >
                                <MessageCircle size={17} />
                            </a>
                        </div>
                    </div>

                    <div className="order-panel-tabs" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === "details"}
                            className={tab === "details" ? "active" : ""}
                            onClick={() => setTab("details")}
                        >
                            Order Details
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === "customer"}
                            className={tab === "customer" ? "active" : ""}
                            onClick={() => setTab("customer")}
                            disabled={!order.customer}
                        >
                            Customer Info
                        </button>
                    </div>

                    {tab === "customer" && order.customer ? (
                        <CustomerInfo customerId={order.customer.id} reload={reload} />
                    ) : (
                        <>
                            {/* ---------- Items ---------- */}
                            <ul className="order-items">
                                {order.items.map((item) => (
                                    <li key={item.id}>
                                        {item.food_image ? (
                                            <img src={item.food_image} alt="" className="thumb" />
                                        ) : (
                                            <span className="thumb thumb-empty"><i className="bi bi-image"></i></span>
                                        )}
                                        <div className="order-item-info">
                                            <strong>{item.food_name}</strong>
                                            <small>{formatPrice(item.unit_price)}</small>
                                            {item.options.length > 0 && (
                                                <small className="order-item-extra">
                                                    {item.options.map((o) => `${o.group_name}: ${o.option_name}`).join(", ")}
                                                </small>
                                            )}
                                            {item.note && <small className="order-item-note">“{item.note}”</small>}
                                        </div>
                                        <span className="order-item-qty">× {item.quantity}</span>
                                        <strong className="order-item-total">{formatPrice(item.subtotal)}</strong>
                                    </li>
                                ))}
                            </ul>

                            <div className="order-total">
                                <span>Total Amount</span>
                                <strong>{formatPrice(order.total_amount)}</strong>
                            </div>

                            {/* ---------- When + where ---------- */}
                            <ul className="order-info">
                                <li>
                                    <Clock size={18} />
                                    <span>
                                        <b>Order Time</b>
                                        {formatDate(order.created_at)}, {formatTime(order.created_at)}
                                    </span>
                                </li>
                                <li>
                                    <MapPin size={18} />
                                    <span>
                                        <b>Delivery Address</b>
                                        {order.delivery_address}
                                    </span>
                                    <a
                                        className="order-map-btn"
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <MapPin size={15} /> View on Map
                                    </a>
                                </li>
                            </ul>
                        </>
                    )}

                    {/* ---------- What the owner can do next ---------- */}
                    {order.next_statuses.length === 0 ? (
                        <p className="order-final">This order is {order.status.toLowerCase()}. No more changes.</p>
                    ) : (
                        <div className="order-panel-actions">
                            {canCancel && (
                                <button
                                    type="button"
                                    className="order-cancel-btn"
                                    disabled={busy}
                                    onClick={() => onChangeStatus(order, "Cancelled")}
                                >
                                    <X size={18} /> Cancel Order
                                </button>
                            )}
                            {nextSteps.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    className="order-next-btn"
                                    disabled={busy}
                                    onClick={() => onChangeStatus(order, s)}
                                >
                                    {busy ? "Saving..." : getActionLabel(s)}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </>
    );
}

export default OrderPanel;
