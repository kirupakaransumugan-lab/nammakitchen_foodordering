import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    CalendarDays,
    ChefHat,
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    Clock,
    ClipboardList,
    EllipsisVertical,
    Eye,
    ShoppingBag,
    Truck
} from "lucide-react";

import OwnerLayout from "./OwnerLayout";
import OrderPanel from "./OrderPanel";
import { useLoad } from "./useLoad";
import { daysAgo, toISODate } from "./dateRanges";
import StatusBadge from "../../components/StatusBadge";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import { changeOrderStatus, getOwnerOrders } from "../../services/ownerService";
import { formatDate, formatOrderId, formatPrice, formatTime } from "../../utils/format";
import { getActionLabel } from "../../utils/orderStatus";

import "./OwnerDashboard.css";   // .panel, .dash-table, .table-pages, .stat-card, .dash-notice
import "./Customers.css";        // .cust-layout + the side panel (same look as Customers)
import "./OwnerOrders.css";


const ORDERS_PER_PAGE = 10;
const REFRESH_EVERY_MS = 30000;   // look for new orders every 30 seconds

// Tabs -> the backend status ("" = all)
const TABS = [
    { label: "All Orders", status: "" },
    { label: "New", status: "Pending" },
    { label: "Confirmed", status: "Confirmed" },
    { label: "Preparing", status: "Preparing" },
    { label: "Out for Delivery", status: "Out for Delivery" },
    { label: "Completed", status: "Delivered" },
    { label: "Cancelled", status: "Cancelled" }
];

// [start, end] as "2026-10-03", or [null, null] for all orders.
// oneDay: the table only needs the time, not the date.
const RANGES = [
    { key: "today", label: "Today", oneDay: true, get: () => [new Date(), new Date()] },
    { key: "yesterday", label: "Yesterday", oneDay: true, get: () => [daysAgo(1), daysAgo(1)] },
    { key: "7d", label: "Last 7 days", get: () => [daysAgo(6), new Date()] },
    { key: "30d", label: "Last 30 days", get: () => [daysAgo(29), new Date()] },
    { key: "all", label: "All dates", get: () => [null, null] }
];


function StatCard({ icon: Icon, color, label, value }) {
    return (
        <div className={`order-stat ${color}`}>
            <span className="order-stat-icon"><Icon size={24} /></span>
            <span>
                <strong>{value}</strong>
                <small>{label}</small>
            </span>
        </div>
    );
}


function OwnerOrders() {
    // The bell opens this page with ?status=Pending
    const [searchParams] = useSearchParams();
    const startStatus = searchParams.get("status");

    const [status, setStatus] = useState(TABS.some((t) => t.status === startStatus) ? startStatus : "");
    const [rangeKey, setRangeKey] = useState("today");
    const [page, setPage] = useState(1);

    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");

    const [selectedId, setSelectedId] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [notice, setNotice] = useState("");

    // Add 1 to load everything again (after a change, and every 30 seconds)
    const [reload, setReload] = useState(0);
    const refresh = () => setReload((n) => n + 1);


    const range = RANGES.find((r) => r.key === rangeKey);
    const [startDate, endDate] = range.get();
    const start = startDate ? toISODate(startDate) : "";
    const end = endDate ? toISODate(endDate) : "";

    const orders = useLoad(
        () => getOwnerOrders({ status, search, start, end, page, limit: ORDERS_PER_PAGE }),
        `${status}|${search}|${start}|${end}|${page}|${reload}`
    );


    // Search after the owner stops typing for a moment
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchText.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchText]);

    // New orders show up without pressing anything
    useEffect(() => {
        const timer = setInterval(() => setReload((n) => n + 1), REFRESH_EVERY_MS);
        return () => clearInterval(timer);
    }, []);

    // Hide the message after 4 seconds
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 4000);
        return () => clearTimeout(timer);
    }, [notice]);


    // Every filter change starts again from page 1
    function changeFilter(setter, value) {
        setter(value);
        setPage(1);
    }

    async function handleStatus(order, newStatus) {
        if (newStatus === "Cancelled" && !window.confirm(`Cancel order ${formatOrderId(order.id)}?`)) {
            return;
        }

        setBusyId(order.id);
        try {
            await changeOrderStatus(order.id, newStatus);
            setNotice(`Order ${formatOrderId(order.id)} is now ${newStatus}.`);
            refresh();
        } catch (err) {
            setNotice(err.message);
        } finally {
            setBusyId(null);
        }
    }


    const data = orders.data;
    const counts = data?.status_counts;


    const hero = (
        <div className="orders-hero">
            <div>
                <h1>Orders</h1>
                <p>Manage and track all your restaurant orders in one place</p>
            </div>

            <p className="owner-hero-quote" aria-hidden="true">
                Good Food<br />Brings People<br />Together
            </p>
        </div>
    );


    return (
        <OwnerLayout
            light
            hero={hero}
            search={searchText}
            onSearchChange={setSearchText}
            searchPlaceholder="Search orders, customer name, items..."
            pendingOrders={data?.pending_now || 0}
        >
            {/* ---------- Tabs + date ---------- */}
            <div className="orders-bar">
                <div className="cust-tabs" role="tablist" aria-label="Order status">
                    {TABS.map((t) => {
                        const count = !counts ? null : t.status ? counts[t.status] : data.all_count;
                        return (
                            <button
                                key={t.label}
                                type="button"
                                role="tab"
                                aria-selected={status === t.status}
                                className={status === t.status ? "cust-tab active" : "cust-tab"}
                                onClick={() => changeFilter(setStatus, t.status)}
                            >
                                {t.label}{count !== null ? ` (${count})` : ""}
                            </button>
                        );
                    })}
                </div>

                <label className="orders-date">
                    <CalendarDays size={18} />
                    <span>
                        {range.label}
                        {range.oneDay && `, ${formatDate(start)}`}
                    </span>
                    <select value={rangeKey} onChange={(e) => changeFilter(setRangeKey, e.target.value)} aria-label="Dates">
                        {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                </label>
            </div>

            <div className={selectedId ? "cust-layout panel-open" : "cust-layout"}>
                <div className="cust-main">
                    {/* ---------- Numbers (same dates + search as the table) ---------- */}
                    {counts && (
                        <section className="order-stats">
                            <StatCard icon={ShoppingBag} color="red" label="Total Orders" value={data.all_count} />
                            <StatCard icon={Clock} color="orange" label="New Orders" value={counts.Pending} />
                            <StatCard icon={ChefHat} color="blue" label="In Kitchen" value={counts.Confirmed + counts.Preparing} />
                            <StatCard icon={Truck} color="purple" label="Out for Delivery" value={counts["Out for Delivery"]} />
                            <StatCard icon={CircleCheck} color="green" label="Completed" value={counts.Delivered} />
                        </section>
                    )}

                    {/* ---------- Table ---------- */}
                    <section className="panel">
                        {!data && orders.loading && <Loading message="Loading orders..." />}
                        {orders.error && <ErrorMessage message={orders.error} onRetry={refresh} />}

                        {data && data.items.length === 0 && (
                            <div className="orders-empty">
                                <ClipboardList size={40} />
                                <p>
                                    {search
                                        ? `No orders match "${search}".`
                                        : `No ${status ? TABS.find((t) => t.status === status).label.toLowerCase() + " " : ""}orders for ${range.label.toLowerCase()}.`}
                                </p>
                            </div>
                        )}

                        {data && data.items.length > 0 && (
                            <>
                                <div className="cust-table-wrap">
                                    <table className="dash-table cust-table orders-table">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Customer</th>
                                                <th className="hide-sm">Items</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                                <th className="hide-md">Order Time</th>
                                                <th><span className="visually-hidden">Actions</span></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.items.map((order) => (
                                                <tr
                                                    key={order.id}
                                                    className={selectedId === order.id ? "selected" : ""}
                                                    onClick={() => setSelectedId(order.id)}
                                                >
                                                    <td className="order-id">{formatOrderId(order.id)}</td>
                                                    <td>
                                                        <strong className="orders-customer">{order.customer_name}</strong>
                                                        <small className="orders-phone">{order.phone}</small>
                                                    </td>
                                                    <td className="hide-sm">
                                                        <span className="orders-items">
                                                            {order.images.map((src) => (
                                                                <img key={src} src={src} alt="" className="thumb" />
                                                            ))}
                                                            <small>{order.item_count} {order.item_count === 1 ? "item" : "items"}</small>
                                                        </span>
                                                    </td>
                                                    <td className="money">{formatPrice(order.total_amount)}</td>
                                                    <td><StatusBadge status={order.status} size={13} /></td>
                                                    <td className="hide-md muted">
                                                        {!range.oneDay && <>{formatDate(order.created_at)}<br /></>}
                                                        {formatTime(order.created_at)}
                                                    </td>
                                                    {/* Clicks here should not also select the row */}
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div className="cust-actions">
                                                            <button
                                                                type="button"
                                                                className="cust-icon-btn"
                                                                onClick={() => setSelectedId(order.id)}
                                                                aria-label={`View order ${formatOrderId(order.id)}`}
                                                                title="View order"
                                                            >
                                                                <Eye size={17} />
                                                            </button>
                                                            <div className="dropdown">
                                                                <button
                                                                    type="button"
                                                                    className="cust-icon-btn"
                                                                    data-bs-toggle="dropdown"
                                                                    disabled={order.next_statuses.length === 0 || busyId === order.id}
                                                                    aria-label={`Change status of order ${formatOrderId(order.id)}`}
                                                                    title={order.next_statuses.length === 0 ? "This order is finished" : "Change status"}
                                                                >
                                                                    <EllipsisVertical size={17} />
                                                                </button>
                                                                <ul className="dropdown-menu dropdown-menu-end">
                                                                    {order.next_statuses.map((s) => (
                                                                        <li key={s}>
                                                                            <button
                                                                                className={s === "Cancelled" ? "dropdown-item text-danger" : "dropdown-item"}
                                                                                onClick={() => handleStatus(order, s)}
                                                                            >
                                                                                {getActionLabel(s)}
                                                                            </button>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {data.total_pages > 1 && (
                                    <div className="table-pages">
                                        <button
                                            type="button"
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                            aria-label="Previous page"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span>Page {page} of {data.total_pages}</span>
                                        <button
                                            type="button"
                                            disabled={page >= data.total_pages}
                                            onClick={() => setPage(page + 1)}
                                            aria-label="Next page"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </div>

                {/* ---------- One order (right side / slide-in on small screens) ---------- */}
                <aside className="panel cust-panel" aria-label="Order details">
                    {selectedId ? (
                        <OrderPanel
                            key={selectedId}
                            orderId={selectedId}
                            reload={reload}
                            busy={busyId === selectedId}
                            onChangeStatus={handleStatus}
                            onClose={() => setSelectedId(null)}
                        />
                    ) : (
                        <div className="cust-panel-empty">
                            <ClipboardList size={42} />
                            <p>Select an order to see its items and update its status.</p>
                        </div>
                    )}
                </aside>

                <div className="cust-panel-backdrop" onClick={() => setSelectedId(null)}></div>
            </div>

            {notice && (
                <div className="dash-notice" role="status" onClick={() => setNotice("")}>
                    {notice}
                </div>
            )}
        </OwnerLayout>
    );
}

export default OwnerOrders;
