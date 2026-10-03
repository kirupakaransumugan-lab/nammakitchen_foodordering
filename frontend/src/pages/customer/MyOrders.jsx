import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";

import Navbar from "../../components/Navbar";
import OrderCard from "../../components/OrderCard";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import EmptyState from "../../components/EmptyState";

import decoLeft from "../../assets/deco-tomato-left.png";
import decoRight from "../../assets/deco-tomato-right.png";
import { cancelMyOrder, getMyOrders } from "../../services/orderService";
import { ORDER_STATUSES } from "../../utils/orderStatus";

import "./customer.css";
import "./MyOrders.css";


function MyOrders() {
    const [activeStatus, setActiveStatus] = useState("");   // "" = All Orders
    const [retryCount, setRetryCount] = useState(0);

    // The last answer from the backend, and which tab it belongs to
    const [result, setResult] = useState({ key: null, orders: [], error: "" });

    const requestKey = activeStatus + "#" + retryCount;
    const loading = result.key !== requestKey;


    // Load the orders every time the tab changes
    useEffect(() => {
        // Stops an old, slow answer from replacing the newer tab's answer
        let ignore = false;

        getMyOrders(activeStatus)
            .then((orders) => {
                if (!ignore) setResult({ key: requestKey, orders: orders, error: "" });
            })
            .catch((err) => {
                if (!ignore) setResult({ key: requestKey, orders: [], error: err.message });
            });

        return () => {
            ignore = true;
        };
    }, [activeStatus, requestKey]);


    // Called by OrderCard. If it fails, OrderCard shows the error.
    async function handleCancel(order) {
        const updated = await cancelMyOrder(order.id);

        setResult((current) => ({
            ...current,
            orders: current.orders
                // On the "Pending" tab the cancelled order no longer belongs here
                .filter((o) => !activeStatus || o.id !== updated.id || updated.status === activeStatus)
                .map((o) => (o.id === updated.id ? updated : o))
        }));
    }


    const emptyMessage = activeStatus
        ? `No ${activeStatus.toLowerCase()} orders.`
        : "You have not ordered anything yet.";


    return (
        <div className="orders-page customer-page">
            <Navbar />

            {/* ---------- Hero ---------- */}
            <section className="page-hero">
                <div className="container">
                    <h1 className="brush-title">
                        <span className="brush-title-white">My</span>{" "}
                        <span className="brush-title-orange">Orders</span>
                    </h1>
                </div>

                <svg
                    className="hero-torn-edge"
                    viewBox="0 0 1440 40"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <path d="M0,22 L40,16 L75,24 L110,12 L150,20 L190,9 L230,18 L270,13 L310,24 L350,11 L395,19 L430,8 L470,17 L515,12 L555,23 L600,10 L640,18 L685,14 L725,25 L765,11 L810,19 L850,9 L890,20 L935,13 L975,22 L1015,10 L1060,18 L1100,12 L1140,24 L1185,11 L1225,19 L1265,8 L1310,17 L1350,13 L1395,22 L1440,14 L1440,40 L0,40 Z" />
                </svg>
            </section>

            {/* ---------- Tabs + orders ---------- */}
            <section className="orders-body">
                <img src={decoLeft} alt="" className="page-deco orders-deco-left" />
                <img src={decoRight} alt="" className="page-deco orders-deco-right" />

                <div className="container orders-container">
                    <div className="orders-tabs" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeStatus === ""}
                            className={activeStatus === "" ? "orders-tab active" : "orders-tab"}
                            onClick={() => setActiveStatus("")}
                        >
                            <ClipboardList size={18} /> All Orders
                        </button>

                        {ORDER_STATUSES.map((status) => {
                            const Icon = status.icon;
                            const isActive = activeStatus === status.value;

                            return (
                                <button
                                    key={status.value}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    className={isActive ? "orders-tab active" : "orders-tab"}
                                    onClick={() => setActiveStatus(status.value)}
                                >
                                    <Icon size={18} /> {status.value}
                                </button>
                            );
                        })}
                    </div>

                    {loading && <Loading message="Loading your orders..." />}

                    {!loading && result.error && (
                        <ErrorMessage
                            message={result.error}
                            onRetry={() => setRetryCount(retryCount + 1)}
                        />
                    )}

                    {!loading && !result.error && result.orders.length === 0 && (
                        <div className="orders-empty">
                            <EmptyState icon="bi-bag" message={emptyMessage} />
                            {!activeStatus && (
                                <Link to="/menu" className="orders-empty-btn">
                                    Browse Menu
                                </Link>
                            )}
                        </div>
                    )}

                    {!loading && !result.error && result.orders.length > 0 && (
                        <div className="orders-list">
                            {result.orders.map((order) => (
                                <OrderCard key={order.id} order={order} onCancel={handleCancel} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default MyOrders;
