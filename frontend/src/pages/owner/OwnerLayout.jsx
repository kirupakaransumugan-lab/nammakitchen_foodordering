import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
    Bell,
    ChartColumn,
    ChevronDown,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Menu,
    Search,
    Settings,
    Store,
    Users,
    UtensilsCrossed
} from "lucide-react";

import logo from "../../assets/logo.png";
import chef from "../../assets/chef-cook.png";
import { getCurrentUser, logoutUser } from "../../services/authService";
import { initials } from "../../utils/format";

import "./OwnerLayout.css";


// "soon" = that page is not built yet, so the link is shown but turned off.
// "badge" = show the pendingOrders number next to the link.
const OWNER_MENU = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/owner" },
    { label: "Menu Management", icon: UtensilsCrossed, to: "/owner/menu" },
    { label: "Orders", icon: ClipboardList, to: "/owner/orders", badge: true },
    { label: "Customers", icon: Users, to: "/owner/customers" },
    { label: "Reports", icon: ChartColumn, to: "/owner/reports" },
    { label: "Restaurant Profile", icon: Store, to: "/owner/profile" },
    { label: "Settings", icon: Settings, to: "/owner/settings" }
];


// Sidebar + top bar for every owner page (and the admin pages, with their own menu).
// "hero" = the big picture area under the top bar (each page sets its own).
// "light" = cream sidebar and hero instead of the dark ones.
// No onSearchChange = no search box. No bellTo = no bell.
function OwnerLayout({
    hero,
    search,
    onSearchChange,
    searchPlaceholder = "Search orders, foods...",
    pendingOrders = 0,
    light = false,
    menu = OWNER_MENU,
    roleLabel = "Restaurant Owner",
    bellTo = "/owner/orders?status=Pending",
    children
}) {
    const navigate = useNavigate();
    const user = getCurrentUser();

    const [sidebarOpen, setSidebarOpen] = useState(false);   // phones / tablets


    function handleLogout() {
        logoutUser();
        navigate("/login");
    }


    return (
        <div className={`owner-shell${light ? " light" : ""}${sidebarOpen ? " sidebar-open" : ""}`}>
            {/* ---------- Sidebar ---------- */}
            <aside className="owner-sidebar">
                <img src={logo} alt="Namma Kitchen" className="owner-logo" />

                <nav className="owner-nav">
                    {menu.map((item) => {
                        const Icon = item.icon;

                        if (item.soon) {
                            return (
                                <span key={item.label} className="owner-nav-link disabled" title="Coming soon">
                                    <Icon size={22} />
                                    <span>{item.label}</span>
                                    <small className="owner-soon">Soon</small>
                                </span>
                            );
                        }

                        return (
                            <NavLink
                                key={item.label}
                                to={item.to}
                                end
                                className="owner-nav-link"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon size={22} />
                                <span>{item.label}</span>
                                {item.badge && pendingOrders > 0 && (
                                    <small className="owner-nav-badge" aria-label={`${pendingOrders} new`}>{pendingOrders}</small>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <button type="button" className="owner-nav-link owner-logout" onClick={handleLogout}>
                    <LogOut size={22} />
                    <span>Logout</span>
                </button>

                {light && <img src={chef} alt="" className="owner-sidebar-chef" />}
            </aside>

            {/* Dark cover behind the sidebar on phones; click to close */}
            <div className="owner-sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>

            {/* ---------- Main ---------- */}
            <div className="owner-main">
                <header className="owner-hero">
                    <div className="owner-topbar">
                        <button
                            type="button"
                            className="owner-icon-btn owner-burger"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>

                        {onSearchChange && (
                            <label className="owner-search">
                                <Search size={18} />
                                <input
                                    type="search"
                                    placeholder={searchPlaceholder}
                                    value={search}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                />
                            </label>
                        )}

                        {/* Pushes the bell and the user menu to the right */}
                        <span className="owner-topbar-gap"></span>

                        {/* Owner: opens the Orders page on the "New" tab */}
                        {bellTo && (
                            <Link
                                to={bellTo}
                                className="owner-icon-btn owner-bell"
                                aria-label={`${pendingOrders} new orders`}
                            >
                                <Bell size={24} />
                                {pendingOrders > 0 && <span className="owner-bell-count">{pendingOrders}</span>}
                            </Link>
                        )}

                        <div className="dropdown">
                            <button
                                type="button"
                                className="owner-user"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <span className="owner-avatar">{initials(user.name)}</span>
                                <span className="owner-user-text">
                                    <strong>{user.name}</strong>
                                    <small>{roleLabel}</small>
                                </span>
                                <ChevronDown size={18} />
                            </button>

                            <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {hero}
                </header>

                <main className="owner-content">{children}</main>
            </div>
        </div>
    );
}

export default OwnerLayout;
