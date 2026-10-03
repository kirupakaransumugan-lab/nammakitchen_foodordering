import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowDown,
    ArrowUp,
    Banknote,
    ChevronLeft,
    ChevronRight,
    Crown,
    Eye,
    EllipsisVertical,
    Heart,
    UserPlus,
    UserRound,
    Users
} from "lucide-react";

import OwnerLayout from "./OwnerLayout";
import CustomerPanel, { Avatar } from "./CustomerPanel";
import { useLoad } from "./useLoad";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import { getCustomerSummary, getCustomers } from "../../services/ownerService";
import { formatDate, formatPrice, formatTime, whatsappLink } from "../../utils/format";

import "./OwnerDashboard.css";   // .panel, .dash-table, .table-pages, .stat-card
import "./Customers.css";


const CUSTOMERS_PER_PAGE = 10;

// The tabs; "count" = which number from the summary to show
const TABS = [
    { key: "all", label: "All Customers", count: "total_customers" },
    { key: "repeat", label: "Repeat Customers", count: "repeat_customers" },
    { key: "new", label: "New Customers", count: "new_this_month" },
    { key: "vip", label: "VIP Customers", count: "vip_customers" }
];

const PERIODS = [
    { key: "all", label: "All Time" },
    { key: "30d", label: "Ordered in last 30 days" },
    { key: "90d", label: "Ordered in last 90 days" },
    { key: "year", label: "Ordered in last year" }
];

const SORTS = [
    { key: "newest", label: "Newest First" },
    { key: "oldest", label: "Oldest First" },
    { key: "last_order", label: "Last Order" },
    { key: "spent", label: "Most Spent" },
    { key: "orders", label: "Most Orders" },
    { key: "name", label: "Name (A-Z)" }
];


function StatCard({ icon: Icon, color, label, value, children }) {
    return (
        <div className="stat-card cust-stat">
            <span className={`stat-icon ${color}`}><Icon size={26} /></span>
            <div>
                <p className="stat-value">{value}</p>
                <p className="stat-label">{label}</p>
                {children}
            </div>
        </div>
    );
}


function Customers() {
    const [tab, setTab] = useState("all");
    const [period, setPeriod] = useState("all");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);

    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");

    const [selectedId, setSelectedId] = useState(null);

    // Add 1 to load everything again (the "Try again" buttons)
    const [reload, setReload] = useState(0);
    const refresh = () => setReload((n) => n + 1);


    const summary = useLoad(getCustomerSummary, `${reload}`);
    const customers = useLoad(
        () => getCustomers({ search, type: tab, period, sort, page, limit: CUSTOMERS_PER_PAGE }),
        `${search}|${tab}|${period}|${sort}|${page}|${reload}`
    );


    // Search after the owner stops typing for a moment
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchText.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchText]);


    // Every filter change starts again from page 1
    function changeFilter(setter, value) {
        setter(value);
        setPage(1);
    }


    const stats = summary.data;
    const list = customers.data;
    const newChange = stats?.new_change;


    const hero = (
        <div className="cust-hero">
            <div>
                <nav className="cust-breadcrumb" aria-label="Breadcrumb">
                    <Link to="/owner">Home</Link>
                    <ChevronRight size={16} />
                    <span>Customers</span>
                </nav>
                <h1>Customers</h1>
                <p>View and manage all your restaurant customers</p>
            </div>

            <p className="owner-hero-quote" aria-hidden="true">
                Happy Food<br />Happy People
            </p>
        </div>
    );


    return (
        <OwnerLayout
            light
            hero={hero}
            search={searchText}
            onSearchChange={setSearchText}
            searchPlaceholder="Search customers by name, phone or email..."
        >
            <div className={selectedId ? "cust-layout panel-open" : "cust-layout"}>
                <div className="cust-main">
                    {/* ---------- Numbers ---------- */}
                    {summary.error && (
                        <div className="panel"><ErrorMessage message={summary.error} onRetry={refresh} /></div>
                    )}

                    {stats && (
                        <section className="cust-stats">
                            <StatCard icon={Users} color="orange" label="Total Customers" value={stats.total_customers} />
                            <StatCard icon={Heart} color="pink" label="Repeat Customers" value={stats.repeat_customers}>
                                {stats.total_customers > 0 && (
                                    <span className="stat-change none">
                                        {Math.round(stats.repeat_customers / stats.total_customers * 100)}% of all customers
                                    </span>
                                )}
                            </StatCard>
                            <StatCard
                                icon={Banknote}
                                color="amber"
                                label="Average Order Value"
                                value={formatPrice(stats.avg_order_value)}
                            />
                            <StatCard icon={UserPlus} color="blue" label="New This Month" value={stats.new_this_month}>
                                {newChange === null ? (
                                    <span className="stat-change none">— vs last month</span>
                                ) : (
                                    <span className={newChange >= 0 ? "stat-change up" : "stat-change down"}>
                                        {newChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                        {newChange >= 0 ? "+" : ""}{newChange}% <small>vs last month</small>
                                    </span>
                                )}
                            </StatCard>
                        </section>
                    )}

                    {/* ---------- Tabs ---------- */}
                    <div className="cust-tabs" role="tablist" aria-label="Customer type">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={tab === t.key}
                                className={tab === t.key ? "cust-tab active" : "cust-tab"}
                                onClick={() => changeFilter(setTab, t.key)}
                            >
                                {t.label}{stats ? ` (${stats[t.count]})` : ""}
                            </button>
                        ))}
                    </div>

                    {/* ---------- Table ---------- */}
                    <section className="panel">
                        <div className="cust-filters">
                            <select
                                className="panel-select"
                                value={period}
                                onChange={(e) => changeFilter(setPeriod, e.target.value)}
                                aria-label="Last order"
                            >
                                {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                            </select>

                            <select
                                className="panel-select"
                                value={sort}
                                onChange={(e) => changeFilter(setSort, e.target.value)}
                                aria-label="Sort"
                            >
                                {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>

                            {list && (
                                <span className="cust-count">
                                    {list.total} {list.total === 1 ? "customer" : "customers"}
                                </span>
                            )}
                        </div>

                        {!list && customers.loading && <Loading message="Loading customers..." />}
                        {customers.error && <ErrorMessage message={customers.error} onRetry={refresh} />}

                        {list && list.items.length === 0 && (
                            <p className="panel-empty">
                                {search ? `No customers match "${search}".` : "No customers here yet."}
                            </p>
                        )}

                        {list && list.items.length > 0 && (
                            <>
                                <div className="cust-table-wrap">
                                    <table className="dash-table cust-table">
                                        <thead>
                                            <tr>
                                                <th>Customer</th>
                                                <th className="hide-md">Contact</th>
                                                <th>Orders</th>
                                                <th>Total Spent</th>
                                                <th className="hide-sm">Last Order</th>
                                                <th className="hide-sm">Status</th>
                                                <th><span className="visually-hidden">Actions</span></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {list.items.map((c) => (
                                                <tr
                                                    key={c.id}
                                                    className={selectedId === c.id ? "selected" : ""}
                                                    onClick={() => setSelectedId(c.id)}
                                                >
                                                    <td>
                                                        <span className="cust-name">
                                                            <Avatar customer={c} />
                                                            <span>
                                                                <strong>{c.name}</strong>
                                                                {c.is_vip && <span className="cust-vip small"><Crown size={11} /> VIP</span>}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="hide-md cust-contact">
                                                        {c.phone}<br /><small>{c.email}</small>
                                                    </td>
                                                    <td>{c.orders} {c.orders === 1 ? "order" : "orders"}</td>
                                                    <td className="money">{formatPrice(c.total_spent)}</td>
                                                    <td className="hide-sm muted">
                                                        {c.last_order ? (
                                                            <>{formatDate(c.last_order)}<br />{formatTime(c.last_order)}</>
                                                        ) : "No orders yet"}
                                                    </td>
                                                    <td className="hide-sm">
                                                        <span className={c.is_active ? "cust-status on" : "cust-status off"}>
                                                            {c.is_active ? "Active" : "Blocked"}
                                                        </span>
                                                    </td>
                                                    {/* Clicks here should not also select the row */}
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div className="cust-actions">
                                                            <button
                                                                type="button"
                                                                className="cust-icon-btn"
                                                                onClick={() => setSelectedId(c.id)}
                                                                aria-label={`View ${c.name}`}
                                                                title="View details"
                                                            >
                                                                <Eye size={17} />
                                                            </button>
                                                            <div className="dropdown">
                                                                <button
                                                                    type="button"
                                                                    className="cust-icon-btn"
                                                                    data-bs-toggle="dropdown"
                                                                    aria-label={`Contact ${c.name}`}
                                                                >
                                                                    <EllipsisVertical size={17} />
                                                                </button>
                                                                <ul className="dropdown-menu dropdown-menu-end">
                                                                    <li><a className="dropdown-item" href={`tel:${c.phone}`}>Call</a></li>
                                                                    <li>
                                                                        <a className="dropdown-item" href={whatsappLink(c.phone)} target="_blank" rel="noreferrer">
                                                                            WhatsApp
                                                                        </a>
                                                                    </li>
                                                                    <li><a className="dropdown-item" href={`mailto:${c.email}`}>Email</a></li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {list.total_pages > 1 && (
                                    <div className="table-pages">
                                        <button
                                            type="button"
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                            aria-label="Previous page"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span>Page {page} of {list.total_pages}</span>
                                        <button
                                            type="button"
                                            disabled={page >= list.total_pages}
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

                {/* ---------- One customer (right side / slide-in on small screens) ---------- */}
                <aside className="panel cust-panel" aria-label="Customer details">
                    {selectedId ? (
                        // key: a new customer gets a fresh panel ("View Full History" closed again)
                        <CustomerPanel
                            key={selectedId}
                            customerId={selectedId}
                            reload={reload}
                            onClose={() => setSelectedId(null)}
                        />
                    ) : (
                        <div className="cust-panel-empty">
                            <UserRound size={42} />
                            <p>Select a customer to see their details and orders.</p>
                        </div>
                    )}
                </aside>

                {/* Dark cover behind the slide-in panel on small screens */}
                <div className="cust-panel-backdrop" onClick={() => setSelectedId(null)}></div>
            </div>
        </OwnerLayout>
    );
}

export default Customers;
