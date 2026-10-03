import { useEffect, useRef, useState } from "react";

import { formatPrice } from "../../../utils/format";


const HEIGHT = 220;
const PAD = { top: 12, right: 14, bottom: 26, left: 46 };
const LINE_COLOR = "#ff6a13";


// A "nice" top for the y axis: 0, 5k, 10k, 15k, 20k instead of 0, 4.3k, 8.6k...
// The axis has 4 steps, so only tops that divide into round quarters are used.
function niceMax(value) {
    if (value <= 0) return 4;
    const power = 10 ** Math.floor(Math.log10(value));
    for (const step of [1, 2, 4, 6, 8, 10]) {
        if (step * power >= value) return step * power;
    }
    return 10 * power;
}

function shortNumber(value) {
    if (value >= 1000000) return (value / 1000000).toFixed(value % 1000000 ? 1 : 0) + "M";
    if (value >= 1000) return (value / 1000).toFixed(value % 1000 ? 1 : 0) + "K";
    return String(value);
}

// Smooth line that never swings above/below the real points
// (monotone curve, so a 0-day never dips under the axis)
function smoothPath(points) {
    if (points.length < 2) {
        return points.length ? `M${points[0].x},${points[0].y}` : "";
    }

    const n = points.length;
    const slopes = [];
    for (let i = 0; i < n - 1; i++) {
        slopes.push((points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x));
    }

    const tangents = [slopes[0]];
    for (let i = 1; i < n - 1; i++) {
        tangents.push(slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2);
    }
    tangents.push(slopes[n - 2]);

    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < n - 1; i++) {
        const dx = (points[i + 1].x - points[i].x) / 3;
        path += ` C${points[i].x + dx},${points[i].y + tangents[i] * dx}`
            + ` ${points[i + 1].x - dx},${points[i + 1].y - tangents[i + 1] * dx}`
            + ` ${points[i + 1].x},${points[i + 1].y}`;
    }
    return path;
}

function dayLabel(day) {
    return new Date(day + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}


// sales: [{ day: "2025-10-01", orders: 2, revenue: 5200 }, ...]
// metric: "revenue" or "orders"
// unit: for other numbers, e.g. metric "signups" + unit "sign-ups" (tooltip shows only that)
function SalesChart({ sales, metric, unit }) {
    const boxRef = useRef(null);
    const [width, setWidth] = useState(600);
    const [hoverIndex, setHoverIndex] = useState(null);

    // Redraw at the real width when the box size changes
    useEffect(() => {
        const box = boxRef.current;
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        observer.observe(box);
        return () => observer.disconnect();
    }, []);


    const values = sales.map((point) => point[metric]);
    const top = niceMax(Math.max(...values, 0));

    const plotWidth = Math.max(width - PAD.left - PAD.right, 10);
    const plotHeight = HEIGHT - PAD.top - PAD.bottom;

    const xOf = (i) => PAD.left + (sales.length > 1 ? (i / (sales.length - 1)) * plotWidth : plotWidth / 2);
    const yOf = (v) => PAD.top + plotHeight - (v / top) * plotHeight;

    const points = sales.map((point, i) => ({ x: xOf(i), y: yOf(point[metric]) }));
    const line = smoothPath(points);
    const baseY = PAD.top + plotHeight;
    const area = points.length
        ? `${line} L${points[points.length - 1].x},${baseY} L${points[0].x},${baseY} Z`
        : "";

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * top);

    // About 6 dates under the chart, always including the first and last day
    const labelEvery = Math.max(1, Math.ceil(sales.length / 6));
    const labelIndexes = [];
    for (let i = 0; i < sales.length; i += labelEvery) {
        labelIndexes.push(i);
    }

    const last = sales.length - 1;
    if (last > 0 && labelIndexes[labelIndexes.length - 1] !== last) {
        // Too close to the last day's label? Drop it, so they do not overlap
        if (last - labelIndexes[labelIndexes.length - 1] < labelEvery * 0.6) {
            labelIndexes.pop();
        }
        labelIndexes.push(last);
    }

    const xLabels = labelIndexes.map((i) => ({ i, day: sales[i].day }));


    function handleMove(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left - PAD.left;
        const i = Math.round((x / plotWidth) * (sales.length - 1));
        setHoverIndex(Math.min(Math.max(i, 0), sales.length - 1));
    }


    const hovered = hoverIndex !== null ? sales[hoverIndex] : null;
    const total = values.reduce((sum, v) => sum + v, 0);


    return (
        <div className="sales-chart" ref={boxRef}>
            <svg
                width={width}
                height={HEIGHT}
                role="img"
                aria-label={
                    unit
                        ? `${unit} per day. Total ${total}.`
                        : `${metric === "revenue" ? "Revenue" : "Orders"} per day. Total ${metric === "revenue" ? formatPrice(total) : total}.`
                }
                onMouseMove={handleMove}
                onMouseLeave={() => setHoverIndex(null)}
            >
                <defs>
                    <linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={LINE_COLOR} stopOpacity="0.28" />
                        <stop offset="100%" stopColor={LINE_COLOR} stopOpacity="0.02" />
                    </linearGradient>
                </defs>

                {/* Light grid + y numbers */}
                {yTicks.map((tick) => (
                    <g key={tick}>
                        <line x1={PAD.left} x2={PAD.left + plotWidth} y1={yOf(tick)} y2={yOf(tick)} className="chart-grid" />
                        <text x={PAD.left - 8} y={yOf(tick)} className="chart-axis" textAnchor="end" dominantBaseline="middle">
                            {shortNumber(tick)}
                        </text>
                    </g>
                ))}

                {xLabels.map(({ i, day }) => (
                    <text key={day} x={xOf(i)} y={HEIGHT - 6} className="chart-axis" textAnchor="middle">
                        {dayLabel(day)}
                    </text>
                ))}

                <path d={area} fill="url(#sales-fill)" />
                <path d={line} fill="none" stroke={LINE_COLOR} strokeWidth="2" strokeLinejoin="round" />

                {/* Hover: line down + dot on the point */}
                {hovered && (
                    <g>
                        <line
                            x1={xOf(hoverIndex)} x2={xOf(hoverIndex)}
                            y1={PAD.top} y2={baseY}
                            className="chart-crosshair"
                        />
                        <circle
                            cx={xOf(hoverIndex)} cy={yOf(values[hoverIndex])} r="5"
                            fill={LINE_COLOR} stroke="#fff" strokeWidth="2"
                        />
                    </g>
                )}
            </svg>

            {hovered && (
                <div
                    className="chart-tooltip"
                    style={{
                        left: Math.min(Math.max(xOf(hoverIndex), 70), width - 70),
                        top: Math.max(yOf(values[hoverIndex]) - 14, 0)
                    }}
                >
                    <strong>{dayLabel(hovered.day)}</strong>
                    {unit ? (
                        <span>{hovered[metric]} {unit}</span>
                    ) : (
                        <>
                            <span>{formatPrice(hovered.revenue)}</span>
                            <span>{hovered.orders} {hovered.orders === 1 ? "order" : "orders"}</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default SalesChart;
