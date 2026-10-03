import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, UserRound } from "lucide-react";

import AdminLayout from "./AdminLayout";
import UserPanel from "./UserPanel";
import { ROLE_OPTIONS } from "./adminRoles";
import { Avatar } from "../owner/CustomerPanel";
import { useLoad } from "../owner/useLoad";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import { getCurrentUser } from "../../services/authService";
import { getAdminUsers, setUserActive, setUserRole } from "../../services/adminService";
import { formatDate, timeAgo } from "../../utils/format";

import "../owner/OwnerDashboard.css";   // .panel, .dash-table, .nk-switch, .table-pages, .dash-notice
import "../owner/Customers.css";        // list + side panel layout, avatars, tabs
import "./ActivityFeed.css";            // .role-badge
import "./AdminDashboard.css";
import "./Users.css";


const USERS_PER_PAGE = 10;

const TABS = [
    { label: "All Users", role: "" },
    { label: "Customers", role: "customer" },
    { label: "Owners", role: "owner" },
    { label: "Admins", role: "admin" }
];

const SORTS = [
    { key: "newest", label: "Newest First" },
    { key: "oldest", label: "Oldest First" },
    { key: "name", label: "Name (A-Z)" },
    { key: "last_login", label: "Last Login" }
];

const ROLE_WARNINGS = {
    owner: "They will be able to manage the menu, orders and customers.",
    admin: "They will get full admin access, including this page.",
    customer: "They will lose any owner or admin access."
};


function Users() {
    const me = getCurrentUser();

    const [role, setRole] = useState("");
    const [active, setActive] = useState("");   // "" | "true" | "false"
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);

    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");

    const [selectedId, setSelectedId] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [notice, setNotice] = useState("");

    const [reload, setReload] = useState(0);
    const refresh = () => setReload((n) => n + 1);


    const users = useLoad(
        () => getAdminUsers({ search, role, active, sort, page, limit: USERS_PER_PAGE }),
        `${search}|${role}|${active}|${sort}|${page}|${reload}`
    );


    // Search after the admin stops typing for a moment
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchText.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchText]);

    // Hide the message after 4 seconds
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 4000);
        return () => clearTimeout(timer);
    }, [notice]);


    function changeFilter(setter, value) {
        setter(value);
        setPage(1);
    }

    // Saves a change, then reloads the table and the panel, or shows the error
    async function runChange(user, action, doneMessage) {
        setBusyId(user.id);
        try {
            await action();
            setNotice(doneMessage);
            refresh();
        } catch (err) {
            setNotice(err.message);
        } finally {
            setBusyId(null);
        }
    }

    function handleSetActive(user, isActive) {
        if (!isActive && !window.confirm(
            `Deactivate ${user.name}?\n\nThey will be signed out and cannot log in until you activate them again.`
        )) {
            return;
        }

        runChange(
            user,
            () => setUserActive(user.id, isActive),
            `${user.name} is now ${isActive ? "active" : "deactivated"}.`
        );
    }

    function handleSetRole(user, newRole) {
        if (newRole === user.role) return;

        const label = ROLE_OPTIONS.find((r) => r.value === newRole).label;
        if (!window.confirm(`Make ${user.name} a ${label}?\n\n${ROLE_WARNINGS[newRole]}`)) {
            return;
        }

        runChange(user, () => setUserRole(user.id, newRole), `${user.name} is now a ${label}.`);
    }


    const data = users.data;
    const counts = data?.role_counts;
    const allCount = counts ? counts.customer + counts.owner + counts.admin : null;


    const hero = (
        <div className="admin-hero">
            <div>
                <p className="admin-eyebrow">Admin Panel</p>
                <h1>Users</h1>
                <p>Activate or deactivate accounts and assign roles</p>
            </div>
            <p className="owner-hero-quote" aria-hidden="true">
                Happy Food<br />Happy People
            </p>
        </div>
    );


    return (
        <AdminLayout
            hero={hero}
            search={searchText}
            onSearchChange={setSearchText}
            searchPlaceholder="Search users by name, email or phone..."
        >
            <div className="users-bar">
                <div className="cust-tabs" role="tablist" aria-label="Role">
                    {TABS.map((t) => {
                        const count = !counts ? null : t.role ? counts[t.role] : allCount;
                        return (
                            <button
                                key={t.label}
                                type="button"
                                role="tab"
                                aria-selected={role === t.role}
                                className={role === t.role ? "cust-tab active" : "cust-tab"}
                                onClick={() => changeFilter(setRole, t.role)}
                            >
                                {t.label}{count !== null ? ` (${count})` : ""}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className={selectedId ? "cust-layout panel-open" : "cust-layout"}>
                <div className="cust-main">
                    <section className="panel">
                        <div className="cust-filters">
                            <select
                                className="panel-select"
                                value={active}
                                onChange={(e) => changeFilter(setActive, e.target.value)}
                                aria-label="Status"
                            >
                                <option value="">All statuses{data ? ` (${data.active_count + data.inactive_count})` : ""}</option>
                                <option value="true">Active{data ? ` (${data.active_count})` : ""}</option>
                                <option value="false">Deactivated{data ? ` (${data.inactive_count})` : ""}</option>
                            </select>

                            <select
                                className="panel-select"
                                value={sort}
                                onChange={(e) => changeFilter(setSort, e.target.value)}
                                aria-label="Sort"
                            >
                                {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>

                            {data && (
                                <span className="cust-count">{data.total} {data.total === 1 ? "user" : "users"}</span>
                            )}
                        </div>

                        {!data && users.loading && <Loading message="Loading users..." />}
                        {users.error && <ErrorMessage message={users.error} onRetry={refresh} />}

                        {data && data.items.length === 0 && (
                            <p className="panel-empty">{search ? `No users match "${search}".` : "No users here."}</p>
                        )}

                        {data && data.items.length > 0 && (
                            <>
                                <div className="cust-table-wrap">
                                    <table className="dash-table cust-table users-table">
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th className="hide-md">Phone</th>
                                                <th>Role</th>
                                                <th className="hide-sm">Joined</th>
                                                <th className="hide-md">Last Login</th>
                                                <th>Active</th>
                                                <th><span className="visually-hidden">View</span></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.items.map((u) => {
                                                const isMe = u.id === me.id;
                                                const busy = busyId === u.id;

                                                return (
                                                    <tr
                                                        key={u.id}
                                                        className={`${selectedId === u.id ? "selected" : ""} ${u.is_active ? "" : "row-off"}`}
                                                        onClick={() => setSelectedId(u.id)}
                                                    >
                                                        <td>
                                                            <span className="cust-name">
                                                                <Avatar customer={u} />
                                                                <span>
                                                                    <strong>
                                                                        {u.name}
                                                                        {isMe && <span className="user-you">You</span>}
                                                                    </strong>
                                                                    <small className="users-email">{u.email}</small>
                                                                </span>
                                                            </span>
                                                        </td>
                                                        <td className="hide-md muted">{u.phone}</td>
                                                        {/* Clicks on the controls should not also select the row */}
                                                        <td onClick={(e) => e.stopPropagation()}>
                                                            <select
                                                                className={`user-role-select ${u.role}`}
                                                                value={u.role}
                                                                disabled={isMe || busy}
                                                                title={isMe ? "You cannot change your own role" : "Change role"}
                                                                onChange={(e) => handleSetRole(u, e.target.value)}
                                                                aria-label={`Role of ${u.name}`}
                                                            >
                                                                {ROLE_OPTIONS.map((r) => (
                                                                    <option key={r.value} value={r.value}>{r.label}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="hide-sm muted">{formatDate(u.created_at)}</td>
                                                        <td className="hide-md muted">
                                                            {u.last_login_at ? timeAgo(u.last_login_at) : "—"}
                                                        </td>
                                                        <td onClick={(e) => e.stopPropagation()}>
                                                            <span className="form-check form-switch nk-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    role="switch"
                                                                    checked={u.is_active}
                                                                    disabled={isMe || busy}
                                                                    title={isMe ? "You cannot deactivate yourself" : ""}
                                                                    onChange={() => handleSetActive(u, !u.is_active)}
                                                                    aria-label={`${u.name} active`}
                                                                />
                                                            </span>
                                                        </td>
                                                        <td onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                type="button"
                                                                className="cust-icon-btn"
                                                                onClick={() => setSelectedId(u.id)}
                                                                aria-label={`View ${u.name}`}
                                                                title="View details and activity"
                                                            >
                                                                <Eye size={17} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
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

                <aside className="panel cust-panel" aria-label="User details">
                    {selectedId ? (
                        <UserPanel
                            key={selectedId}
                            userId={selectedId}
                            isMe={selectedId === me.id}
                            reload={reload}
                            busy={busyId === selectedId}
                            onSetActive={handleSetActive}
                            onSetRole={handleSetRole}
                            onClose={() => setSelectedId(null)}
                        />
                    ) : (
                        <div className="cust-panel-empty">
                            <UserRound size={42} />
                            <p>Select a user to see their account, change access and watch their activity.</p>
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
        </AdminLayout>
    );
}

export default Users;
