import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Banknote,
    CalendarDays,
    ChartSpline,
    ChevronRight,
    CircleX,
    Download,
    LayoutGrid,
    PieChart,
    Receipt,
    ShoppingCart,
    Trophy,
    UtensilsCrossed
} from "lucide-react";

import OwnerLayout from "./OwnerLayout";
import SalesChart from "./charts/SalesChart";
import StatusDonut from "./charts/StatusDonut";
import { useLoad } from "./useLoad";
import { DATE_RANGES, toISODate } from "./dateRanges";
import { RangePicker, StatCard } from "../admin/AdminParts";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import { getOwnerReport } from "../../services/ownerService";
import { formatDate, formatPrice } from "../../utils/format";

import "./OwnerDashboard.css";          // .panel, .stat-card, .top-foods, .dash-table
import "../admin/AdminDashboard.css";   // .admin-stats, .admin-row, .role-bars, .admin-range
import "./Customers.css";               // .cust-hero, .cust-breadcrumb
import "./OwnerReports.css";


// One line per day -> a file Excel can open
function downloadCsv(report) {
    const lines = [["Date", "Orders", "Revenue (Rs.)"]];

    for (const point of report.sales) {
        lines.push([point.day, point.orders, point.revenue.toFixed(2)]);
    }

    const text = lines.map((line) => line.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    link.download = `namma-kitchen-sales_${report.start}_to_${report.end}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}


function OwnerReports() {
    const [rangeKey, setRangeKey] = useState("month");
    const [metric, setMetric] = useState("revenue");
    const [reload, setReload] = useState(0);

    const range = DATE_RANGES.find((r) => r.key === rangeKey);
    const [startDate, endDate] = range.get();
    const start = toISODate(startDate);
    const end = toISODate(endDate);

    const report = useLoad(() => getOwnerReport(start, end), `${start}|${end}|${reload}`);
    const data = report.data;

    const maxCategory = data ? Math.max(...data.category_sales.map((c) => c.revenue), 0) : 0;
    // Newest day first, only days that had orders
    const busyDays = data ? data.sales.filter((d) => d.orders > 0).reverse() : [];


    const hero = (
        <div className="cust-hero report-hero">
            <div>
                <nav className="cust-breadcrumb" aria-label="Breadcrumb">
                    <Link to="/owner">Home</Link>
                    <ChevronRight size={16} />
                    <span>Reports</span>
                </nav>
                <h1>Reports</h1>
                <p>Sales, best sellers and menu performance for any period</p>
            </div>

            <p className="owner-hero-quote" aria-hidden="true">
                Good Food<br />Good Numbers
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
        <OwnerLayout light hero={hero}>
            {!data && report.loading && <div className="panel"><Loading message="Loading report..." /></div>}
            {report.error && (
                <div className="panel">
                    <ErrorMessage message={report.error} onRetry={() => setReload((n) => n + 1)} />
                </div>
            )}

            {data && (
                <div className={report.loading ? "report-body loading" : "report-body"}>
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
                                <h2><Trophy size={22} className="panel-icon" /> Best Sellers</h2>
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

                    <section className="panel">
                        <div className="panel-head">
                            <h2><CalendarDays size={22} className="panel-icon" /> Daily Sales</h2>
                            <button type="button" className="panel-btn" onClick={() => downloadCsv(data)}>
                                <Download size={16} /> Download CSV
                            </button>
                        </div>

                        {busyDays.length === 0 ? (
                            <p className="panel-empty">No orders in this period.</p>
                        ) : (
                            <div className="report-table-wrap">
                                <table className="dash-table report-days">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Orders</th>
                                            <th>Revenue</th>
                                            <th className="hide-sm">Average Order</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {busyDays.map((d) => (
                                            <tr key={d.day}>
                                                <td>{formatDate(d.day)}</td>
                                                <td>{d.orders}</td>
                                                <td className="money">{formatPrice(d.revenue)}</td>
                                                <td className="hide-sm muted">{formatPrice(d.revenue / d.orders)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </OwnerLayout>
    );
}

export default OwnerReports;
