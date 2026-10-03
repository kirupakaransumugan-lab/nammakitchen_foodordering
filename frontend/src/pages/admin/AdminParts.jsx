import { ArrowDown, ArrowUp } from "lucide-react";


// Number card with "+12% vs previous period" under it.
// change: null = nothing to compare with; undefined = no line at all (use "note" instead)
export function StatCard({ icon: Icon, color, label, value, change, note }) {
    let line = null;

    if (note) {
        line = <span className="stat-change none">{note}</span>;
    } else if (change === null) {
        line = <span className="stat-change none">— vs previous period</span>;
    } else if (change !== undefined) {
        const up = change >= 0;
        const Arrow = up ? ArrowUp : ArrowDown;
        line = (
            <span className={up ? "stat-change up" : "stat-change down"}>
                <Arrow size={14} /> {up ? "+" : ""}{change}% <small>vs previous period</small>
            </span>
        );
    }

    return (
        <div className="stat-card admin-stat">
            <span className={`stat-icon ${color}`}><Icon size={24} /></span>
            <div>
                <p className="stat-label">{label}</p>
                <p className="stat-value">{value}</p>
                {line}
            </div>
        </div>
    );
}


const ROLE_NAMES = { customer: "Customer", owner: "Owner", admin: "Admin", system: "System" };

export function RoleBadge({ role }) {
    return <span className={`role-badge ${role}`}>{ROLE_NAMES[role] || role}</span>;
}


// White box with the dates; the real <select> lies on top, invisible
export function RangePicker({ ranges, value, onChange, label }) {
    return (
        <label className="admin-range">
            <span>{label}</span>
            <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Date range">
                {ranges.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
        </label>
    );
}
