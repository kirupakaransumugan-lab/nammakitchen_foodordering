import { useState } from "react";

import { ORDER_STATUSES } from "../../../utils/orderStatus";


const SIZE = 180;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 2;   // white gap between slices, so neighbours never touch


// counts: [{ status: "Pending", count: 48 }, ...] (all 6 statuses)
function StatusDonut({ counts }) {
    const [hovered, setHovered] = useState(null);

    const total = counts.reduce((sum, c) => sum + c.count, 0);
    const colorOf = (status) => ORDER_STATUSES.find((s) => s.value === status)?.chartColor;

    // Where each slice starts and how long it is, along the circle
    const slices = [];
    let offset = 0;
    for (const c of counts) {
        if (c.count === 0) continue;

        const length = (c.count / total) * CIRCUMFERENCE;
        slices.push({ ...c, start: offset, length });
        offset += length;
    }

    const onlyOne = slices.length === 1;
    const percent = (count) => (total ? Math.round((count / total) * 100) : 0);
    const shown = hovered ? counts.find((c) => c.status === hovered) : null;


    return (
        <div className="status-donut">
            <div className="status-donut-chart">
                <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
                    {/* Grey ring: shown alone when there are no orders */}
                    <circle
                        cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
                        fill="none" stroke="#f1ebe5" strokeWidth={STROKE}
                    />

                    {slices.map((slice) => (
                        <circle
                            key={slice.status}
                            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
                            fill="none"
                            stroke={colorOf(slice.status)}
                            strokeWidth={hovered === slice.status ? STROKE + 4 : STROKE}
                            strokeDasharray={`${Math.max(slice.length - (onlyOne ? 0 : GAP), 0.5)} ${CIRCUMFERENCE}`}
                            strokeDashoffset={-slice.start}
                            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                            onMouseEnter={() => setHovered(slice.status)}
                            onMouseLeave={() => setHovered(null)}
                            className="status-donut-slice"
                        />
                    ))}
                </svg>

                {/* Middle: total, or the hovered slice */}
                <div className="status-donut-center">
                    <strong>{shown ? shown.count : total}</strong>
                    <span>{shown ? shown.status : total === 1 ? "Order" : "Orders"}</span>
                </div>
            </div>

            {/* The legend is also the table of numbers */}
            <ul className="status-donut-legend">
                {counts.map((c) => (
                    <li
                        key={c.status}
                        className={hovered === c.status ? "active" : ""}
                        onMouseEnter={() => setHovered(c.status)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <span className="legend-dot" style={{ background: colorOf(c.status) }}></span>
                        <span className="legend-name">{c.status}</span>
                        <span className="legend-value">
                            {c.count} <small>({percent(c.count)}%)</small>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default StatusDonut;
