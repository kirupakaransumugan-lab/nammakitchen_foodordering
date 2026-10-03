import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, ShoppingBag, X } from "lucide-react";

import CartItem from "./CartItem";
import { useCart } from "../context/CartContext";
import { getCurrentUser } from "../services/authService";
import { placeOrder } from "../services/orderService";
import { formatPrice } from "../utils/format";

import "./Cards.css";
import "./CartPopup.css";


// The card that opens under the cart button.
// Step 1 "cart": items + total + Buy Now
// Step 2 "checkout": delivery address + phone + Place Order
//
// position: { top, right } in pixels, worked out by the Navbar from the button
function CartPopup({ position, onClose }) {
    const navigate = useNavigate();
    const { cartItems, getCartCount, getTotal, clearCart } = useCart();

    const user = getCurrentUser();

    const [step, setStep] = useState("cart");
    const [address, setAddress] = useState(user?.address || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");


    // Close with the Esc key
    useEffect(() => {
        function handleKey(event) {
            if (event.key === "Escape") onClose();
        }

        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [onClose]);


    function handleBuyNow() {
        // Only a logged-in customer can order
        if (!user || user.role !== "customer") {
            onClose();
            navigate("/login");
            return;
        }

        setError("");
        setStep("checkout");
    }


    async function handlePlaceOrder(event) {
        event.preventDefault();

        // Same rules as the backend, so the customer sees the problem at once
        if (address.trim().length < 5) {
            setError("Please enter your full delivery address.");
            return;
        }

        if (phone.trim().length < 9) {
            setError("Please enter a valid phone number.");
            return;
        }

        setPlacing(true);
        setError("");

        try {
            await placeOrder(cartItems, address.trim(), phone.trim());
            clearCart();
            onClose();
            navigate("/my-orders");
        } catch (err) {
            setError(err.message);
            setPlacing(false);
        }
    }


    const count = getCartCount();


    return createPortal(
        <>
            {/* Clicking anywhere outside the card closes it */}
            <div className="cart-popup-backdrop" onClick={onClose}></div>

            <div
                className="cart-popup"
                style={{ top: position.top, right: position.right }}
                role="dialog"
                aria-label="Your cart"
            >
                <div className="cart-popup-head">
                    {step === "checkout" && (
                        <button
                            type="button"
                            className="cart-popup-icon-btn"
                            onClick={() => setStep("cart")}
                            aria-label="Back to cart"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}

                    <h2>
                        {step === "cart" ? "My Cart" : "Delivery Details"}
                        {step === "cart" && count > 0 && <span>{count} {count === 1 ? "item" : "items"}</span>}
                    </h2>

                    <button
                        type="button"
                        className="cart-popup-icon-btn"
                        onClick={onClose}
                        aria-label="Close cart"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ---------- Empty cart ---------- */}
                {cartItems.length === 0 && (
                    <div className="cart-popup-empty">
                        <ShoppingBag size={40} strokeWidth={1.4} />
                        <p>Your cart is empty.</p>
                        <button
                            type="button"
                            className="cart-popup-btn"
                            onClick={() => {
                                onClose();
                                navigate("/menu");
                            }}
                        >
                            Browse Menu
                        </button>
                    </div>
                )}

                {/* ---------- Step 1: items ---------- */}
                {cartItems.length > 0 && step === "cart" && (
                    <>
                        <ul className="cart-popup-items">
                            {cartItems.map((item) => (
                                <CartItem key={item.key} item={item} />
                            ))}
                        </ul>

                        <div className="cart-popup-foot">
                            <div className="cart-popup-total">
                                <span>Total</span>
                                <strong>{formatPrice(getTotal())}</strong>
                            </div>

                            <button type="button" className="cart-popup-btn" onClick={handleBuyNow}>
                                Buy Now
                            </button>
                        </div>
                    </>
                )}

                {/* ---------- Step 2: where to deliver ---------- */}
                {cartItems.length > 0 && step === "checkout" && (
                    <form className="cart-popup-checkout" onSubmit={handlePlaceOrder}>
                        <label>
                            <span><MapPin size={15} /> Delivery Address</span>
                            <textarea
                                rows={3}
                                maxLength={255}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="House no, street, city"
                            />
                        </label>

                        <label>
                            <span><Phone size={15} /> Phone</span>
                            <input
                                type="tel"
                                maxLength={20}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="07X XXX XXXX"
                            />
                        </label>

                        {error && <p className="cart-popup-error">{error}</p>}

                        <div className="cart-popup-foot">
                            <div className="cart-popup-total">
                                <span>{count} {count === 1 ? "item" : "items"}</span>
                                <strong>{formatPrice(getTotal())}</strong>
                            </div>

                            <button type="submit" className="cart-popup-btn" disabled={placing}>
                                {placing ? "Placing order..." : "Place Order"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </>,
        document.body
    );
}

export default CartPopup;
