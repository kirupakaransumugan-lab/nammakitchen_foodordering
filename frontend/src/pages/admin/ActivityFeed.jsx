import { useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    CircleX,
    ClipboardList,
    LayoutGrid,
    LogIn,
    ShieldCheck,
    ShoppingBag,
    UserCheck,
    UserPlus,
    UserX,
    UtensilsCrossed
} from "lucide-react";

import { RoleBadge } from "./AdminParts";
import { useLoad } from "../owner/useLoad";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import { getActivity } from "../../services/adminService";
import { formatDate, formatTime, timeAgo } from "../../utils/format";

import "./ActivityFeed.css";


// action code (from the backend) -> icon + colour
const ACTION_LOOK = {
    login: { icon: LogIn, color: "blue" },
    register: { icon: UserPlus, color: "green" },
    order_placed: { icon: ShoppingBag, color: "orange" },
    order_cancelled: { icon: CircleX, color: "red" },
    order_status: { icon: ClipboardList, color: "purple" },
    food_created: { icon: UtensilsCrossed, color: "green" },
    food_updated: { icon: UtensilsCrossed, color: "orange" },
    food_deleted: { icon: UtensilsCrossed, color: "red" },
    category_created: { icon: LayoutGrid, color: "green" },
    category_updated: { icon: LayoutGrid, color: "orange" },
    category_deleted: { icon: LayoutGrid, color: "red" },
    user_activated: { icon: UserCheck, color: "green" },
    user_deactivated: { icon: UserX, color: "red" },
    role_changed: { icon: ShieldCheck, color: "purple" }
};


// Just the list (the data comes from outside)
export function ActivityList({ items, emptyText = "No activity yet." }) {
    if (items.length === 0) {
        return <p className="panel-empty">{emptyText}</p>;
    }

    return (
        <ul className="activity-list">
            {items.map((a) => {
                const look = ACTION_LOOK[a.action] || { icon: ClipboardList, color: "grey" };
                const Icon = look.icon;

                return (
                    <li key={a.id}>
                        <span className={`activity-icon ${look.color}`}><Icon size={17} /></span>
                        <div className="activity-text">
                            <p>
                                <strong>{a.user_name}</strong> {a.description}
                            </p>
                            <small>
                                <RoleBadge role={a.user_role} />
                                <time dateTime={a.created_at} title={`${formatDate(a.created_at)}, ${formatTime(a.created_at)}`}>
                                    {timeAgo(a.created_at)}
                                </time>
                            </small>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}


// Loads the activity itself, with pages and optional tabs.
//   tabs: [{ label: "Customers", area: "user" }, ...]  (the first one is shown first)
//   filters: { start, end, search, user_id } added to every request
function ActivityFeed({ tabs, filters = {}, reload = 0, limit = 10, emptyText }) {
    const [area, setArea] = useState(tabs[0].area);
    const [page, setPage] = useState(1);

    // A filter change (dates, search) starts again from page 1
    const filterKey = JSON.stringify(filters);
    const [lastFilterKey, setLastFilterKey] = useState(filterKey);
    if (filterKey !== lastFilterKey) {
        setLastFilterKey(filterKey);
        setPage(1);
    }

    const activity = useLoad(
        () => getActivity({ ...filters, area, page, limit }),
        `${area}|${page}|${filterKey}|${reload}`
    );
    const data = activity.data;


    return (
        <>
            {tabs.length > 1 && (
                <div className="activity-tabs" role="tablist">
                    {tabs.map((t) => (
                        <button
                            key={t.area}
                            type="button"
                            role="tab"
                            aria-selected={area === t.area}
                            className={area === t.area ? "active" : ""}
                            onClick={() => { setArea(t.area); setPage(1); }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            {!data && activity.loading && <Loading message="Loading activity..." />}
            {activity.error && <ErrorMessage message={activity.error} />}

            {data && <ActivityList items={data.items} emptyText={emptyText} />}

            {data && data.total_pages > 1 && (
                <div className="table-pages">
                    <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Newer">
                        <ChevronLeft size={16} />
                    </button>
                    <span>Page {page} of {data.total_pages}</span>
                    <button
                        type="button"
                        disabled={page >= data.total_pages}
                        onClick={() => setPage(page + 1)}
                        aria-label="Older"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </>
    );
}

export default ActivityFeed;
