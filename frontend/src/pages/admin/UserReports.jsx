import { useEffect, useState } from "react";
import {
    History,
    LogIn,
    Repeat,
    ShoppingBag,
    Trophy,
    UserPlus,
    UsersRound
} from "lucide-react";

import AdminLayout from "./AdminLayout";
import ActivityFeed from "./ActivityFeed";
import { RangePicker, StatCard } from "./AdminParts";
import SalesChart from "../owner/charts/SalesChart";
import { useLoad } from "../owner/useLoad";
import { DATE_RANGES, toISODate } from "../owner/dateRanges";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import { getUserReport } from "../../services/adminService";
import { formatDate, formatPrice } from "../../utils/format";

import "../owner/OwnerDashboard.css";   // .panel, .stat-card, charts, .dash-table
import "./AdminDashboard.css";
import "./Reports.css";


const ROLES = [
    { key: "customer", label: "Customers", color: "#1c7ed6" },
    { key: "owner", label: "Restaurant Owners", color: "#ff6a13" },
    { key: "admin", label: "Admins", color: "#7a33e6" }
];


// Users report: sign-ups, who orders, top customers, and what users did
function UserReports() {
    const [rangeKey, setRangeKey] = useState("month");
    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");
    const [reload, setReload] = useState(0);

    const range = DATE_RANGES.find((r) => r.key === rangeKey);
    const [startDate, endDate] = range.get();
    const start = toISODate(startDate);
    const end = toISODate(endDate);

    const report = useLoad(() => getUserReport(start, end), `${start}|${end}|${reload}`);
    const data = report.data;


    // Search the activity after the admin stops typing for a moment
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchText.trim()), 400);
        return () => clearTimeout(timer);
    }, [searchText]);


    // The chart draws one number per day
    const signups = data
        ? data.signups.map((d) => ({ day: d.day, signups: d.customers + d.staff }))
        : [];
    const staffSignups = data ? data.signups.reduce((sum, d) => sum + d.staff, 0) : 0;
    const totalUsers = data ? data.active_users + data.inactive_users : 0;


    const hero = (
        <div className="admin-hero">
            <div>
                <p className="admin-eyebrow">Reports</p>
                <h1>User Reports</h1>
                <p>Sign-ups, ordering customers and user activity</p>
            </div>
            <p className="owner-hero-quote" aria-hidden="true">
                Happy Food<br />Happy People
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
            searchPlaceholder="Search user activity..."
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
                            icon={UserPlus} color="orange" label="New Users"
                            value={data.stats.new_users.value} change={data.stats.new_users.change}
                        />
                        <StatCard
                            icon={ShoppingBag} color="green" label="Ordering Customers"
                            value={data.stats.ordering_customers.value} change={data.stats.ordering_customers.change}
                        />
                        <StatCard
                            icon={Repeat} color="purple" label="Returning Customers"
                            value={data.stats.returning_customers}
                            note="Had ordered before this period"
                        />
                        <StatCard
                            icon={LogIn} color="blue" label="Logins"
                            value={data.stats.logins}
                            note="All roles, in this period"
                        />
                    </section>

                    <section className="admin-row admin-row-wide">
                        <div className="panel">
                            <div className="panel-head">
                                <h2><UserPlus size={22} className="panel-icon" /> Sign-ups per Day</h2>
                                {staffSignups > 0 && <small className="muted">incl. {staffSignups} staff</small>}
                            </div>
                            <SalesChart sales={signups} metric="signups" unit="sign-ups" />
                        </div>

                        <div className="panel">
                            <div className="panel-head">
                                <h2><UsersRound size={22} className="panel-icon" /> All Users Now</h2>
                            </div>
                            <ul className="role-bars">
                                {ROLES.map((r) => {
                                    const count = data.role_counts[r.key] || 0;
                                    return (
                                        <li key={r.key}>
                                            <div className="role-bars-label">
                                                <span>{r.label}</span>
                                                <strong>{count}</strong>
                                            </div>
                                            <div className="role-bars-track" aria-hidden="true">
                                                <span
                                                    style={{
                                                        width: `${totalUsers ? (count / totalUsers) * 100 : 0}%`,
                                                        background: r.color
                                                    }}
                                                ></span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            <p className="report-split">
                                <span className="cust-status on">{data.active_users} active</span>
                                <span className="cust-status off">{data.inactive_users} deactivated</span>
                            </p>
                        </div>
                    </section>

                    <section className="panel report-section">
                        <div className="panel-head">
                            <h2><Trophy size={22} className="panel-icon" /> Top Customers</h2>
                        </div>

                        {data.top_customers.length === 0 ? (
                            <p className="panel-empty">No orders in this period.</p>
                        ) : (
                            <div className="report-table-wrap">
                                <table className="dash-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Customer</th>
                                            <th className="hide-sm">Email</th>
                                            <th>Orders</th>
                                            <th>Spent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.top_customers.map((c, index) => (
                                            <tr key={c.id}>
                                                <td className="muted">{index + 1}</td>
                                                <td><strong>{c.name}</strong></td>
                                                <td className="hide-sm muted">{c.email}</td>
                                                <td>{c.orders}</td>
                                                <td className="money">{formatPrice(c.spent)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}

            <section className="panel">
                <div className="panel-head">
                    <h2><History size={22} className="panel-icon" /> User Activity</h2>
                </div>
                <ActivityFeed
                    tabs={[
                        { label: "Customers & Logins", area: "user" },
                        { label: "Admin Changes", area: "admin" }
                    ]}
                    filters={{ start, end, search }}
                    reload={reload}
                    emptyText="No activity in this period."
                />
            </section>
        </AdminLayout>
    );
}

export default UserReports;
