import { useEffect, useState } from "react";
import {
    Banknote,
    ChartSpline,
    CircleX,
    History,
    LayoutGrid,
    PieChart,
    Receipt,
    ShoppingCart,
    Trophy,
    UtensilsCrossed
} from "lucide-react";

import AdminLayout from "./AdminLayout";
import ActivityFeed from "./ActivityFeed";
import { RangePicker, StatCard } from "./AdminParts";
import SalesChart from "../owner/charts/SalesChart";
import StatusDonut from "../owner/charts/StatusDonut";
import { useLoad } from "../owner/useLoad";
import { DATE_RANGES, toISODate } from "../owner/dateRanges";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import { getRestaurantReport } from "../../services/adminService";
import { formatDate, formatPrice } from "../../utils/format";

import "../owner/OwnerDashboard.css";   // .panel, .stat-card, charts, .dash-table, .top-foods
import "./AdminDashboard.css";
import "./Reports.css";


// Restaurant report: sales, menu and everything the owner did, for any date range
function Reports() {
    const [rangeKey, setRangeKey] = useState("month");
    const [metric, setMetric] = useState("revenue");
    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");
    const [reload, setReload] = useState(0);

    // Search the activity after the admin stops typing for a moment
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchText.trim()), 400);
        return () => clearTimeout(timer);
    }, [searchText]);

    const range = DATE_RANGES.find((r) => r.key === rangeKey);
    const [startDate, endDate] = range.get();
    const start = toISODate(startDate);
    const end = toISODate(endDate);

    const report = useLoad(() => getRestaurantReport(start, end), `${start}|${end}|${reload}`);
    const data = report.data;
    const maxCategory = data ? Math.max(...data.category_sales.map((c) => c.revenue), 0) : 0;


    const hero = (
        <div className="admin-hero">
            <div>
                <p className="admin-eyebrow">Reports</p>
                <h1>Restaurant Reports</h1>
                <p>Sales, menu performance and the owner&apos;s activity</p>
            </div>
            <p className="owner-hero-quote" aria-hidden="true">
                Good Food<br />Brings People<br />Together
            </p>
            <RangePicker
                ranges={DATE_RANGES}
                value={rangeKey}
                onChange={setRangeKey}
                label={`${formatDate(start)} - ${formatDate(end)}`}
            />
        </div>
    );


    return (
        <AdminLayout
            hero={hero}
            search={searchText}
            onSearchChange={setSearchText}
            searchPlaceholder="Search restaurant activity..."
        >
            {!data && report.loading && <div className="panel"><Loading message="Loading report..." /></div>}
            {report.error && (
                <div className="panel">
                    <ErrorMessage message={report.error} onRetry={() => setReload((n) => n + 1)} />
                </div>
            )}

            {data && (
                <>
                    <section className="admin-stats">
                        <StatCard
                            icon={ShoppingCart} color="orange" label="Orders"
                            value={data.stats.orders.value.toLocaleString()} change={data.stats.orders.change}
                        />
                        <StatCard
                            icon={Banknote} color="green" label="Revenue"
                            value={formatPrice(data.stats.revenue.value)} change={data.stats.revenue.change}
                        />
                        <StatCard
                            icon={Receipt} color="amber" label="Average Order"
                            value={formatPrice(data.stats.avg_order_value.value)} change={data.stats.avg_order_value.change}
                        />
                        <StatCard
                            icon={CircleX} color="red" label="Cancelled Orders"
                            value={data.stats.cancelled_orders}
                            note={`${data.stats.cancel_rate}% of all orders`}
                        />
                        <StatCard
                            icon={UtensilsCrossed} color="blue" label="Menu Items"
                            value={`${data.menu.available_foods} / ${data.menu.foods}`}
                            note={`available now · ${data.menu.categories} categories`}
                        />
                    </section>

                    <section className="admin-row admin-row-wide">
                        <div className="panel">
                            <div className="panel-head">
                                <h2><ChartSpline size={22} className="panel-icon" /> Sales Overview</h2>
                                <select
                                    className="panel-select"
                                    value={metric}
                                    onChange={(e) => setMetric(e.target.value)}
                                    aria-label="Show"
                                >
                                    <option value="revenue">Revenue</option>
                                    <option value="orders">Orders</option>
                                </select>
                            </div>
                            <SalesChart sales={data.sales} metric={metric} />
                        </div>

                        <div className="panel">
                            <div className="panel-head">
                                <h2><PieChart size={22} className="panel-icon" /> Order Status</h2>
                            </div>
                            <StatusDonut counts={data.status_counts} />
                        </div>
                    </section>

                    <section className="admin-row admin-row-half">
                        <div className="panel">
                            <div className="panel-head">
                                <h2><Trophy size={22} className="panel-icon" /> Top Selling Foods</h2>
                            </div>

                            {data.top_foods.length === 0 ? (
                                <p className="panel-empty">Nothing sold in this period.</p>
                            ) : (
                                <ul className="top-foods">
                                    {data.top_foods.map((food) => (
                                        <li key={food.food_id}>
                                            {food.image ? (
                                                <img src={food.image} alt="" className="thumb" />
                                            ) : (
                                                <span className="thumb thumb-empty"><i className="bi bi-image"></i></span>
                                            )}
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

                        <div className="panel">
                            <div className="panel-head">
                                <h2><LayoutGrid size={22} className="panel-icon" /> Sales by Category</h2>
                            </div>

                            {data.category_sales.length === 0 ? (
                                <p className="panel-empty">Nothing sold in this period.</p>
                            ) : (
                                <ul className="role-bars">
                                    {data.category_sales.map((c) => (
                                        <li key={c.name}>
                                            <div className="role-bars-label">
                                                <span>{c.name} <small>· {c.quantity} sold</small></span>
                                                <strong>{formatPrice(c.revenue)}</strong>
                                            </div>
                                            <div className="role-bars-track" aria-hidden="true">
                                                <span style={{ width: `${maxCategory ? (c.revenue / maxCategory) * 100 : 0}%` }}></span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                </>
            )}

            {/* Owner's actions: menu changes and order status updates */}
            <section className="panel">
                <div className="panel-head">
                    <h2><History size={22} className="panel-icon" /> Restaurant Activity</h2>
                </div>
                <ActivityFeed
                    tabs={[{ label: "Restaurant", area: "restaurant" }]}
                    filters={{ start, end, search }}
                    reload={reload}
                    emptyText="No restaurant activity in this period."
                />
            </section>
        </AdminLayout>
    );
}

export default Reports;
