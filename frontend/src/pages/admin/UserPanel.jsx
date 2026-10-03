import {
    Banknote,
    CalendarDays,
    LogIn,
    Mail,
    MapPin,
    Phone,
    ShoppingBag,
    UserCheck,
    UserX,
    X
} from "lucide-react";

import { RoleBadge } from "./AdminParts";
import { ROLE_OPTIONS } from "./adminRoles";
import ActivityFeed from "./ActivityFeed";
import { Avatar } from "../owner/CustomerPanel";
import { useLoad } from "../owner/useLoad";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import { getAdminUser } from "../../services/adminService";
import { formatDate, formatPrice, formatTime } from "../../utils/format";

import "../../components/Modal.css";   // .nk-field


// The right side of the Users page: one user, what the admin can change, and their activity.
//   onSetActive(user, isActive) / onSetRole(user, role): the page asks, saves and reloads
function UserPanel({ userId, isMe, reload, busy, onSetActive, onSetRole, onClose }) {
    const detail = useLoad(() => getAdminUser(userId), `${userId}|${reload}`);
    const u = detail.data;
    const ready = u && u.id === userId;


    return (
        <>
            <button type="button" className="cust-panel-close" onClick={onClose} aria-label="Close">
                <X size={20} />
            </button>

            {!ready && detail.loading && <Loading message="Loading user..." />}
            {detail.error && <ErrorMessage message={detail.error} />}

            {ready && (
                <>
                    <div className="cust-panel-top">
                        <Avatar customer={u} large />
                        <div>
                            <h2>{u.name}</h2>
                            <div className="cust-panel-tags">
                                <RoleBadge role={u.role} />
                                <span className={u.is_active ? "cust-status on" : "cust-status off"}>
                                    {u.is_active ? "Active" : "Deactivated"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <h3 className="cust-panel-title">Account</h3>
                    <ul className="cust-info">
                        <li><Mail size={17} /> {u.email}</li>
                        <li><Phone size={17} /> {u.phone}</li>
                        <li><MapPin size={17} /> {u.address || <span className="muted">No address saved</span>}</li>
                        <li><CalendarDays size={17} /> Joined {formatDate(u.created_at)}</li>
                        <li>
                            <LogIn size={17} />
                            {u.last_login_at
                                ? `Last login ${formatDate(u.last_login_at)}, ${formatTime(u.last_login_at)}`
                                : <span className="muted">No login recorded yet</span>}
                        </li>
                    </ul>

                    {u.role === "customer" && (
                        <div className="cust-tiles">
                            <div className="cust-tile">
                                <ShoppingBag size={20} />
                                <span><strong>{u.orders}</strong><small>Orders</small></span>
                            </div>
                            <div className="cust-tile">
                                <Banknote size={20} />
                                <span><strong>{formatPrice(u.total_spent)}</strong><small>Total Spent</small></span>
                            </div>
                        </div>
                    )}

                    {/* ---------- What the admin can change ---------- */}
                    <h3 className="cust-panel-title">Access</h3>
                    {isMe ? (
                        <p className="user-me-note">This is your own account. Another admin must change your role or status.</p>
                    ) : (
                        <div className="user-access">
                            <label className="nk-field">
                                <span>Role</span>
                                <select
                                    value={u.role}
                                    disabled={busy}
                                    onChange={(e) => onSetRole(u, e.target.value)}
                                >
                                    {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </label>

                            <button
                                type="button"
                                className={u.is_active ? "user-status-btn off" : "user-status-btn on"}
                                disabled={busy}
                                onClick={() => onSetActive(u, !u.is_active)}
                            >
                                {u.is_active ? <><UserX size={18} /> Deactivate</> : <><UserCheck size={18} /> Activate</>}
                            </button>
                        </div>
                    )}

                    <h3 className="cust-panel-title">Activity</h3>
                    <ActivityFeed
                        tabs={[{ label: "All", area: "" }]}
                        filters={{ user_id: u.id }}
                        reload={reload}
                        limit={8}
                        emptyText="No activity recorded for this user yet."
                    />
                </>
            )}
        </>
    );
}

export default UserPanel;
