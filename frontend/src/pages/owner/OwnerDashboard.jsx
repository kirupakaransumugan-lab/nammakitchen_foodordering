import { useEffect, useState } from "react";
import {
    ArrowDown,
    ArrowUp,
    Banknote,
    CalendarDays,
    ChartColumn,
    ChevronLeft,
    ChevronRight,
    Clock,
    ConciergeBell,
    EllipsisVertical,
    LayoutGrid,
    PieChart,
    Plus,
    ShoppingCart,
    Trophy,
    Users,
    Utensils
} from "lucide-react";

import OwnerLayout from "./OwnerLayout";
import CategoryForm from "./CategoryForm";
import FoodForm from "./FoodForm";
import SalesChart from "./charts/SalesChart";
import StatusDonut from "./charts/StatusDonut";
import { useLoad } from "./useLoad";
import { DATE_RANGES as RANGES, toISODate } from "./dateRanges";
import Modal from "../../components/Modal";
import StatusBadge from "../../components/StatusBadge";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import {
    changeOrderStatus,
    deleteCategory,
    deleteFood,
    getDashboard,
    getOwnerCategories,
    getOwnerFoods,
    updateFood
} from "../../services/ownerService";
import { formatDate, formatOrderId, formatPrice, formatTime } from "../../utils/format";

import "./OwnerDashboard.css";


const FOODS_PER_PAGE = 8;


// ---------- Small pieces ----------

// "+12%" in green, "-5%" in red, or a dash when there is nothing to compare with
function Change({ value }) {
    if (value === null || value === undefined) {
        return <span className="stat-change none">— vs previous period</span>;
    }

    const up = value >= 0;
    const Arrow = up ? ArrowUp : ArrowDown;

    return (
        <span className={up ? "stat-change up" : "stat-change down"}>
            <Arrow size={14} /> {up ? "+" : ""}{value}% <small>vs previous period</small>
        </span>
    );
}

function StatCard({ icon: Icon, color, label, value, change, note }) {
    return (
        <div className="stat-card">
            <span className={`stat-icon ${color}`}><Icon size={28} /></span>
            <div>
                <p className="stat-label">{label}</p>
                <p className="stat-value">{value}</p>
                {note ? <span className="stat-change none">{note}</span> : <Change value={change} />}
            </div>
        </div>
    );
}

function PanelHead({ icon: Icon, title, children }) {
    return (
        <div className="panel-head">
            <h2><Icon size={24} className="panel-icon" /> {title}</h2>
            {children}
        </div>
    );
}

function Thumb({ src }) {
    return src ? (
        <img src={src} alt="" className="thumb" />
    ) : (
        <span className="thumb thumb-empty"><i className="bi bi-image"></i></span>
    );
}


// ---------- Page ----------

function OwnerDashboard() {
    const [rangeKey, setRangeKey] = useState("month");
    const [metric, setMetric] = useState("revenue");

    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");
    const [foodPage, setFoodPage] = useState(1);

    // Add 1 to load everything again after a change (new food, status, ...)
    const [reload, setReload] = useState(0);
    const refresh = () => setReload((n) => n + 1);

    const [categoryForm, setCategoryForm] = useState(null);   // null | { category }
    const [foodForm, setFoodForm] = useState(null);           // null | { food }
    const [busyId, setBusyId] = useState(null);
    const [notice, setNotice] = useState("");


    const range = RANGES.find((r) => r.key === rangeKey);
    const [startDate, endDate] = range.get();
    const start = toISODate(startDate);
    const end = toISODate(endDate);

    const dashboard = useLoad(() => getDashboard(start, end), `${start}|${end}|${reload}`);
    const categories = useLoad(getOwnerCategories, `${reload}`);
    const foods = useLoad(
        () => getOwnerFoods({ search, page: foodPage, limit: FOODS_PER_PAGE }),
        `${search}|${foodPage}|${reload}`
    );


    // Search after the owner stops typing for a moment
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchText.trim());
            setFoodPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchText]);

    // Hide the message after 4 seconds
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 4000);
        return () => clearTimeout(timer);
    }, [notice]);


    // Runs a change (status, delete, ...), then reloads, or shows the error
    async function runAction(id, action, doneMessage) {
        setBusyId(id);
        try {
            await action();
            refresh();
            if (doneMessage) setNotice(doneMessage);
        } catch (err) {
            setNotice(err.message);
        } finally {
            setBusyId(null);
        }
    }

    function handleStatus(order, status) {
        runAction(`order-${order.id}`, () => changeOrderStatus(order.id, status), `Order ${formatOrderId(order.id)} is now ${status}.`);
    }

    function handleToggleFood(food) {
        runAction(`food-${food.id}`, () => updateFood(food.id, { is_available: !food.is_available }));
    }

    function handleDeleteFood(food) {
        if (!window.confirm(`Delete "${food.name}"?`)) return;
        runAction(`food-${food.id}`, () => deleteFood(food.id), `"${food.name}" deleted.`);
    }

    function handleDeleteCategory(category) {
        if (!window.confirm(`Delete the "${category.name}" category?`)) return;
        runAction(`cat-${category.id}`, () => deleteCategory(category.id), `"${category.name}" deleted.`);
    }

    function closeFormsAndReload(message) {
        setCategoryForm(null);
        setFoodForm(null);
        refresh();
        setNotice(message);
    }


    const data = dashboard.data;
    const stats = data?.stats;

    // The top search also filters the recent orders
    const query = search.toLowerCase();
    const recentOrders = (data?.recent_orders || []).filter((order) =>
        !query
        || formatOrderId(order.id).toLowerCase().includes(query)
        || order.customer_name.toLowerCase().includes(query)
        || order.items_summary.toLowerCase().includes(query)
    );


    const hero = (
        <div className="dash-hero">
            <div>
                <h1>Welcome <span>Back!</span></h1>
                <p>Manage your restaurant, menu and orders easily.</p>
            </div>

            <label className="dash-range">
                <CalendarDays size={20} />
                <span className="dash-range-dates">{formatDate(start)} - {formatDate(end)}</span>
                <select value={rangeKey} onChange={(e) => setRangeKey(e.target.value)} aria-label="Date range">
                    {RANGES.map((r) => (
                        <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                </select>
            </label>
        </div>
    );


    return (
        <OwnerLayout
            hero={hero}
            search={searchText}
            onSearchChange={setSearchText}
            pendingOrders={data?.pending_orders || 0}
        >
            {!data && dashboard.loading && <div className="panel"><Loading message="Loading dashboard..." /></div>}

            {dashboard.error && (
                <div className="panel">
                    <ErrorMessage message={dashboard.error} onRetry={refresh} />
                </div>
            )}

            {data && (
                <>
                    {/* ---------- Numbers ---------- */}
                    <section className="stat-grid">
                        <StatCard
                            icon={ShoppingCart} color="orange" label="Total Orders"
                            value={stats.total_orders.value.toLocaleString()}
                            change={stats.total_orders.change}
                        />
                        <StatCard
                            icon={Users} color="green" label="Total Customers"
                            value={stats.total_customers.value.toLocaleString()}
                            change={stats.total_customers.change}
                        />
                        <StatCard
                            icon={Banknote} color="amber" label="Total Revenue"
                            value={formatPrice(stats.total_revenue.value)}
                            change={stats.total_revenue.change}
                        />
                        <StatCard
                            icon={Utensils} color="red" label="Active Food Items"
                            value={stats.active_foods}
                            note="Available right now"
                        />
                    </section>

                    {/* ---------- Charts ---------- */}
                    <section className="dash-row dash-row-charts">
                        <div className="panel">
                            <PanelHead icon={ChartColumn} title="Sales Overview">
                                <select
                                    className="panel-select"
                                    value={metric}
                                    onChange={(e) => setMetric(e.target.value)}
                                    aria-label="Show"
                                >
                                    <option value="revenue">Revenue</option>
                                    <option value="orders">Orders</option>
                                </select>
                            </PanelHead>

                            <SalesChart sales={data.sales} metric={metric} />
                        </div>

                        <div className="panel">
                            <PanelHead icon={PieChart} title="Order Status" />
                            <StatusDonut counts={data.status_counts} />
                        </div>
                    </section>

                    {/* ---------- Recent orders + top foods ---------- */}
                    <section className="dash-row dash-row-lists">
                        <div className="panel" id="recent-orders">
                            <PanelHead icon={Clock} title="Recent Orders" />

                            {recentOrders.length === 0 ? (
                                <p className="panel-empty">
                                    {query ? "No recent orders match your search." : "No orders yet."}
                                </p>
                            ) : (
                                <table className="dash-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Customer</th>
                                            <th>Items</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th className="hide-sm">Order Time</th>
                                            <th><span className="visually-hidden">Action</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="order-id">{formatOrderId(order.id)}</td>
                                                <td>
                                                    <span className="with-thumb">
                                                        <Thumb src={order.image} />
                                                        {order.customer_name}
                                                    </span>
                                                </td>
                                                <td>{order.items_summary}</td>
                                                <td className="money">{formatPrice(order.total_amount)}</td>
                                                <td><StatusBadge status={order.status} size={14} /></td>
                                                <td className="hide-sm muted">
                                                    {formatDate(order.created_at)}<br />{formatTime(order.created_at)}
                                                </td>
                                                <td>
                                                    <div className="dropdown">
                                                        <button
                                                            type="button"
                                                            className="row-menu-btn"
                                                            data-bs-toggle="dropdown"
                                                            disabled={order.next_statuses.length === 0 || busyId === `order-${order.id}`}
                                                            aria-label={`Change status of order ${order.id}`}
                                                            title={order.next_statuses.length === 0 ? "This order is finished" : "Change status"}
                                                        >
                                                            <EllipsisVertical size={18} />
                                                        </button>
                                                        <ul className="dropdown-menu dropdown-menu-end">
                                                            {order.next_statuses.map((status) => (
                                                                <li key={status}>
                                                                    <button
                                                                        className={status === "Cancelled" ? "dropdown-item text-danger" : "dropdown-item"}
                                                                        onClick={() => handleStatus(order, status)}
                                                                    >
                                                                        {status === "Cancelled" ? "Cancel order" : `Mark as ${status}`}
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="panel">
                            <PanelHead icon={Trophy} title="Top Selling Foods" />

                            {data.top_foods.length === 0 ? (
                                <p className="panel-empty">Nothing sold in this period yet.</p>
                            ) : (
                                <ul className="top-foods">
                                    {data.top_foods.map((food) => (
                                        <li key={food.food_id}>
                                            <Thumb src={food.image} />
                                            <div className="top-food-info">
                                                <strong>{food.name}</strong>
                                                <small>{food.quantity} sold · {food.orders} {food.orders === 1 ? "order" : "orders"}</small>
                                            </div>
                                            <div className="top-food-bar" aria-hidden="true">
                                                <span style={{ width: `${food.percent}%` }}></span>
                                            </div>
                                            <span className="top-food-pct">{Math.round(food.percent)}%</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                </>
            )}

            {/* ---------- Categories + foods ---------- */}
            <section className="dash-row dash-row-menu">
                <div className="panel" id="categories">
                    <PanelHead icon={LayoutGrid} title="Category Management">
                        <button type="button" className="panel-btn" onClick={() => setCategoryForm({ category: null })}>
                            <Plus size={16} /> Add Category
                        </button>
                    </PanelHead>

                    {categories.error && <ErrorMessage message={categories.error} onRetry={refresh} />}

                    {categories.data && categories.data.length === 0 && (
                        <p className="panel-empty">No categories yet. Add your first one, e.g. "Pizza".</p>
                    )}

                    {categories.data && categories.data.length > 0 && (
                        <div className="category-tiles">
                            {categories.data.map((category) => (
                                <div key={category.id} className="category-tile">
                                    <Thumb src={category.image} />
                                    <div className="category-tile-row">
                                        <div>
                                            <strong>{category.name}</strong>
                                            <small>{category.food_count} {category.food_count === 1 ? "item" : "items"}</small>
                                        </div>

                                        <div className="dropdown">
                                            <button
                                                type="button"
                                                className="row-menu-btn"
                                                data-bs-toggle="dropdown"
                                                disabled={busyId === `cat-${category.id}`}
                                                aria-label={`Options for ${category.name}`}
                                            >
                                                <EllipsisVertical size={16} />
                                            </button>
                                            <ul className="dropdown-menu dropdown-menu-end">
                                                <li>
                                                    <button className="dropdown-item" onClick={() => setCategoryForm({ category })}>
                                                        Edit
                                                    </button>
                                                </li>
                                                <li>
                                                    <button className="dropdown-item text-danger" onClick={() => handleDeleteCategory(category)}>
                                                        Delete
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="panel" id="foods">
                    <PanelHead icon={ConciergeBell} title="Food Items Management">
                        <button
                            type="button"
                            className="panel-btn"
                            onClick={() => setFoodForm({ food: null })}
                            disabled={!categories.data || categories.data.length === 0}
                            title={categories.data?.length === 0 ? "Add a category first" : ""}
                        >
                            <Plus size={16} /> Add Food Item
                        </button>
                    </PanelHead>

                    {foods.error && <ErrorMessage message={foods.error} onRetry={refresh} />}

                    {foods.data && foods.data.items.length === 0 && (
                        <p className="panel-empty">
                            {search ? `No foods match "${search}".` : "No food items yet."}
                        </p>
                    )}

                    {foods.data && foods.data.items.length > 0 && (
                        <>
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th className="hide-sm">#</th>
                                        <th>Food Name</th>
                                        <th className="hide-sm">Category</th>
                                        <th>Price</th>
                                        <th>Available</th>
                                        <th><span className="visually-hidden">Action</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {foods.data.items.map((food, index) => (
                                        <tr key={food.id} className={food.is_available ? "" : "row-off"}>
                                            <td className="hide-sm muted">{(foodPage - 1) * FOODS_PER_PAGE + index + 1}</td>
                                            <td>
                                                <span className="with-thumb">
                                                    <Thumb src={food.image} />
                                                    {food.name}
                                                </span>
                                            </td>
                                            <td className="hide-sm"><span className="category-pill">{food.category.name}</span></td>
                                            <td className="money">{formatPrice(food.price)}</td>
                                            <td>
                                                <span className="form-check form-switch nk-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        role="switch"
                                                        checked={food.is_available}
                                                        disabled={busyId === `food-${food.id}`}
                                                        onChange={() => handleToggleFood(food)}
                                                        aria-label={`${food.name} available`}
                                                    />
                                                </span>
                                            </td>
                                            <td>
                                                <div className="dropdown">
                                                    <button
                                                        type="button"
                                                        className="row-menu-btn"
                                                        data-bs-toggle="dropdown"
                                                        aria-label={`Options for ${food.name}`}
                                                    >
                                                        <EllipsisVertical size={18} />
                                                    </button>
                                                    <ul className="dropdown-menu dropdown-menu-end">
                                                        <li>
                                                            <button className="dropdown-item" onClick={() => setFoodForm({ food })}>
                                                                Edit
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button className="dropdown-item text-danger" onClick={() => handleDeleteFood(food)}>
                                                                Delete
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {foods.data.total_pages > 1 && (
                                <div className="table-pages">
                                    <button
                                        type="button"
                                        disabled={foodPage === 1}
                                        onClick={() => setFoodPage(foodPage - 1)}
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span>Page {foodPage} of {foods.data.total_pages}</span>
                                    <button
                                        type="button"
                                        disabled={foodPage >= foods.data.total_pages}
                                        onClick={() => setFoodPage(foodPage + 1)}
                                        aria-label="Next page"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {categoryForm && (
                <CategoryForm
                    category={categoryForm.category}
                    onClose={() => setCategoryForm(null)}
                    onSaved={() => closeFormsAndReload(categoryForm.category ? "Category saved." : "Category added.")}
                />
            )}

            {foodForm && (
                <Modal title={foodForm.food ? "Edit Food Item" : "Add Food Item"} onClose={() => setFoodForm(null)} width={560}>
                    <FoodForm
                        food={foodForm.food}
                        categories={categories.data || []}
                        onCancel={() => setFoodForm(null)}
                        onSaved={() => closeFormsAndReload(foodForm.food ? "Food item saved." : "Food item added.")}
                    />
                </Modal>
            )}

            {notice && (
                <div className="dash-notice" role="status" onClick={() => setNotice("")}>
                    {notice}
                </div>
            )}
        </OwnerLayout>
    );
}

export default OwnerDashboard;
