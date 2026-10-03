// Date -> "2025-10-01" (local day, not UTC)
export function toISODate(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}


// The date range boxes on the dashboards and reports: key -> [first day, last day]
export const DATE_RANGES = [
    { key: "today", label: "Today", get: () => [new Date(), new Date()] },
    { key: "7d", label: "Last 7 days", get: () => [daysAgo(6), new Date()] },
    { key: "30d", label: "Last 30 days", get: () => [daysAgo(29), new Date()] },
    {
        key: "month", label: "This month",
        get: () => { const t = new Date(); return [new Date(t.getFullYear(), t.getMonth(), 1), t]; }
    },
    {
        key: "last-month", label: "Last month",
        get: () => {
            const t = new Date();
            return [new Date(t.getFullYear(), t.getMonth() - 1, 1), new Date(t.getFullYear(), t.getMonth(), 0)];
        }
    },
    {
        key: "year", label: "This year",
        get: () => { const t = new Date(); return [new Date(t.getFullYear(), 0, 1), t]; }
    }
];
