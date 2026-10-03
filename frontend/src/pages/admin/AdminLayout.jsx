import { ChartColumn, ChartPie, LayoutDashboard, Settings, UsersRound } from "lucide-react";

import OwnerLayout from "../owner/OwnerLayout";


const ADMIN_MENU = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
    { label: "Users", icon: UsersRound, to: "/admin/users" },
    { label: "Restaurant Reports", icon: ChartColumn, to: "/admin/reports/restaurant" },
    { label: "User Reports", icon: ChartPie, to: "/admin/reports/users" },
    { label: "Settings", icon: Settings, soon: true }
];


// Same sidebar + top bar as the owner pages, with the admin's menu and no order bell
function AdminLayout(props) {
    return (
        <OwnerLayout
            {...props}
            light
            menu={ADMIN_MENU}
            roleLabel="Administrator"
            bellTo={null}
        />
    );
}

export default AdminLayout;
