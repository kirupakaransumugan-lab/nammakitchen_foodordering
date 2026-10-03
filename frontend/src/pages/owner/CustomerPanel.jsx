import { useState } from "react";
import {
    Banknote,
    CalendarDays,
    ChartLine,
    Crown,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    ShoppingBag,
    X,
    XCircle
} from "lucide-react";

import { useLoad } from "./useLoad";
import StatusBadge from "../../components/StatusBadge";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import { getCustomerDetail } from "../../services/ownerService";
import { formatDate, formatPrice, formatOrderId, formatTime, initials, whatsappLink } from "../../utils/format";


const SHORT_HISTORY = 3;
const FULL_HISTORY = 50;   // the most the backend sends


// Same customer -> same colour, so the avatars do not jump around
export function Avatar({ customer, large = false }) {
    return (
        <span className={`cust-avatar c${customer.id % 5}${large ? " large" : ""}`}>
            {initials(customer.name)}
        </span>
    );
}


// The right side of the Customers page: one customer's details.
// "reload" changes when the page reloads its data.
function CustomerPanel({ customerId, reload, onClose }) {
    const [fullHistory, setFullHistory] = useState(false);
    const ordersLimit = fullHistory ? FULL_HISTORY : SHORT_HISTORY;

    const detail = useLoad(
        () => getCustomerDetail(customerId, ordersLimit),
        `${customerId}|${ordersLimit}|${reload}`
    );

    const c = detail.data;
    // While the next customer loads, do not show the old one's details
    const ready = c && c.id === customerId;


    return (
        <>
            <button type="button" className="cust-panel-close" onClick={onClose} aria-label="Close">
                <X size={20} />
            </button>

            {!ready && detail.loading && <Loading message="Loading customer..." />}
            {detail.error && <ErrorMessage message={detail.error} />}

            {ready && (
                <>
                    {/* ---------- Name + quick contact ---------- */}
                    <div className="cust-panel-top">
                        <Avatar customer={c} large />
                        <div>
                            <h2>{c.name}</h2>
                            <div className="cust-panel-tags">
                                {c.is_vip && <span className="cust-vip"><Crown size={13} /> VIP Customer</span>}
                                {!c.is_active && <span className="cust-status off">Blocked</span>}
                            </div>
                            <div className="cust-contact-btns">
                                <a href={`tel:${c.phone}`} className="call" aria-label={`Call ${c.name}`} title="Call">
                                    <Phone size={17} />
                                </a>
                                <a
                                    href={whatsappLink(c.phone)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="chat"
                                    aria-label={`WhatsApp ${c.name}`}
                                    title="WhatsApp"
                                >
                                    <MessageCircle size={17} />
                                </a>
                                <a href={`mailto:${c.email}`} className="mail" aria-label={`Email ${c.name}`} title="Email">
                                    <Mail size={17} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* ---------- Information ---------- */}
                    <h3 className="cust-panel-title">Customer Information</h3>
                    <ul className="cust-info">
                        <li><Phone size={17} /> {c.phone}</li>
                        <li><Mail size={17} /> {c.email}</li>
                        <li><MapPin size={17} /> {c.address || <span className="muted">No address saved</span>}</li>
                        <li><CalendarDays size={17} /> Member since {formatDate(c.created_at)}</li>
                    </ul>

                    {/* ---------- Numbers ---------- */}
                    <div className="cust-tiles">
                        <div className="cust-tile">
                            <ShoppingBag size={20} />
                            <span><strong>{c.orders}</strong><small>Total Orders</small></span>
                        </div>
                        <div className="cust-tile">
                            <Banknote size={20} />
                            <span><strong>{formatPrice(c.total_spent)}</strong><small>Total Spent</small></span>
                        </div>
                        <div className="cust-tile">
                            <ChartLine size={20} />
                            <span><strong>{formatPrice(c.avg_order_value)}</strong><small>Avg. Order Value</small></span>
                        </div>
                        <div className="cust-tile">
                            <XCircle size={20} />
                            <span><strong>{c.cancelled_orders}</strong><small>Cancelled Orders</small></span>
                        </div>
                    </div>

                    {/* ---------- Orders ---------- */}
                    <div className="cust-panel-title-row">
                        <h3 className="cust-panel-title">{fullHistory ? "Order History" : "Recent Orders"}</h3>
                        {detail.loading && <small className="muted">Loading...</small>}
                    </div>

                    {c.recent_orders.length === 0 ? (
                        <p className="panel-empty">No orders yet.</p>
                    ) : (
                        <ul className={fullHistory ? "cust-orders full" : "cust-orders"}>
                            {c.recent_orders.map((order) => (
                                <li key={order.id}>
                                    {order.image ? (
                                        <img src={order.image} alt="" className="thumb" />
                                    ) : (
                                        <span className="thumb thumb-empty"><i className="bi bi-image"></i></span>
                                    )}
                                    <div className="cust-order-info">
                                        <strong>{order.items_summary}</strong>
                                        <small>{formatOrderId(order.id)} · {formatDate(order.created_at)} · {formatTime(order.created_at)}</small>
                                    </div>
                                    <div className="cust-order-side">
                                        <strong>{formatPrice(order.total_amount)}</strong>
                                        <StatusBadge status={order.status} size={12} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="cust-panel-actions">
                        <button
                            type="button"
                            className="nk-btn nk-btn-light"
                            onClick={() => setFullHistory(!fullHistory)}
                            disabled={!fullHistory && c.orders + c.cancelled_orders <= SHORT_HISTORY}
                        >
                            {fullHistory ? "Show Less" : "View Full History"}
                        </button>
                        <a href={`mailto:${c.email}`} className="nk-btn nk-btn-primary">
                            <Mail size={17} /> Message Customer
                        </a>
                    </div>
                </>
            )}
        </>
    );
}

export default CustomerPanel;
