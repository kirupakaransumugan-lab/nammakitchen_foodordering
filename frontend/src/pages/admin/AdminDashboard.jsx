import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Banknote,
    ChartColumn,
    ChartPie,
    ChartSpline,
    Clock,
    History,
    ShoppingCart,
    UserCheck,
    UserRoundCog,
    Users,
    UsersRound
} from "lucide-react";

import AdminLayout from "./AdminLayout";
import { StatCard } from "./AdminParts";
import { ActivityList } from "./ActivityFeed";
import SalesChart from "../owner/charts/SalesChart";
import { useLoad } from "../owner/useLoad";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import { getCurrentUser } from "../../services/authService";
import { getAdminOverview } from "../../services/adminService";
import { formatPrice } from "../../utils/format";

import "../owner/OwnerDashboard.css";   // .panel, .stat-card, .sales-chart
import "./AdminDashboard.css";


const ROLES = [
    { key: "customer", label: "Customers", color: "#1c7ed6" },
    { key: "owner", label: "Restaurant Owners", color: "#ff6a13" },
    { key: "admin", label: "Admins", color: "#7a33e6" }
];

const LINKS = [
    { to: "/admin/users", icon: UserRoundCog, title: "Manage Users", text: "Activate, deactivate and change roles" },
    { to: "/admin/reports/restaurant", icon: ChartColumn, title: "Restaurant Reports", text: "Sales, menu and owner activity" },
    { to: "/admin/reports/users", icon: ChartPie, title: "User Reports", text: "Sign-ups, customers and logins" }
];


function AdminDashboard() {
    const user = getCurrentUser();
    const [metric, setMetric] = useState("revenue");
    const [reload, setReload] = useState(0);

    const overview = useLoad(getAdminOverview, `${reload}`);
    const data = overview.data;


    const hero = (
        <div className="admin-hero">
            <div>
                <p className="admin-eyebrow">Admin Panel</p>
                <h1>Welcome back, {user.name.split(" ")[0]}!</h1>
                <p>Here is what is happening across Namma Kitchen.</p>
            </div>
            <p className="owner-hero-quote" aria-hidden="true">
                Good Food<br />Brings People<br />Together
            </p>
        </div>
    );


    return (
        <AdminLayout hero={hero}>
            {!data && overview.loading && <div className="panel"><Loading message="Loading dashboard..." /></div>}
            {overview.error && (
                <div className="panel">
                    <ErrorMessage message={overview.error} onRetry={() => setReload((n) => n + 1)} />
                </div>
            )}

            {data && (
                <>
                    {/* ---------- Numbers ---------- */}
                    <section className="admin-stats">
                        <StatCard
                            icon={Users} color="orange" label="Total Users" value={data.total_users}
                            note={`+${data.new_users_7d} in the last 7 days`}
                        />
                        <StatCard
                            icon={UserCheck} color="green" label="Active Users" value={data.active_users}
                            note={`${data.inactive_users} deactivated`}
                        />
                        <StatCard
                            icon={ShoppingCart} color="blue" label="Orders Today" value={data.orders_today}
                            note={`${data.orders_month} this month`}
                        />
                        <StatCard
                            icon={Banknote} color="amber" label="Revenue Today" value={formatPrice(data.revenue_today)}
                            note={`${formatPrice(data.revenue_month)} this month`}
                        />
                        <StatCard
                            icon={Clock} color="red" label="Pending Orders" value={data.pending_orders}
                            note="Waiting for the restaurant"
                        />
                    </section>

                    {/* ---------- Sales + users by role ---------- */}
                    <section className="admin-row admin-row-wide">
                        <div className="panel">
                            <div className="panel-head">
                                <h2><ChartSpline size={22} className="panel-icon" /> Sales — Last 14 Days</h2>
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
                                <h2><UsersRound size={22} className="panel-icon" /> Users by Role</h2>
                            </div>
                            <ul className="role-bars">
                                {ROLES.map((r) => {
                                    const count = data.role_counts[r.key] || 0;
                                    const percent = data.total_users ? (count / data.total_users) * 100 : 0;
                                    return (
                                        <li key={r.key}>
                                            <div className="role-bars-label">
                                                <span>{r.label}</span>
                                                <strong>{count}</strong>
                                            </div>
                                            <div className="role-bars-track" aria-hidden="true">
                                                <span style={{ width: `${percent}%`, background: r.color }}></span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            <Link to="/admin/users" className="admin-link">Manage users →</Link>
                        </div>
                    </section>

                    {/* ---------- Activity + shortcuts ---------- */}
                    <section className="admin-row admin-row-wide">
                        <div className="panel">
                            <div className="panel-head">
                                <h2><History size={22} className="panel-icon" /> Latest Activity</h2>
                            </div>
                            <ActivityList items={data.recent_activity} />
                        </div>

                        <div className="admin-links">
                            {LINKS.map((l) => {
                                const Icon = l.icon;
                                return (
                                    <Link key={l.to} to={l.to} className="admin-link-card">
                                        <span className="admin-link-icon"><Icon size={22} /></span>
                                        <span>
                                            <strong>{l.title}</strong>
                                            <small>{l.text}</small>
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}
        </AdminLayout>
    );
}

export default AdminDashboard;
