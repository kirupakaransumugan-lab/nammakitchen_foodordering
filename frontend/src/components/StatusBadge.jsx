import { getStatusInfo } from "../utils/orderStatus";

import "./StatusBadge.css";


// Coloured pill with an icon, e.g. [🕒 Pending]
function StatusBadge({ status, size = 16 }) {
    const info = getStatusInfo(status);
    const Icon = info.icon;

    return (
        <span className={`order-status ${info.color}`}>
            <Icon size={size} /> {status}
        </span>
    );
}

export default StatusBadge;
