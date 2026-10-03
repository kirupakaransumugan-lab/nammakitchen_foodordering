import { useCallback, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import CartPopup from "./CartPopup";
import logo from "../assets/logo.png";
import { useCart } from "../context/CartContext";
import { getCurrentUser, logoutUser } from "../services/authService";

import "./Navbar.css";


function Navbar() {
    const navigate = useNavigate();
    const { getCartCount, clearCart } = useCart();

    const user = getCurrentUser();
    const cartCount = getCartCount();

    // Show only the first name in the button, e.g. "Sangavi"
    const firstName = user ? user.name.split(" ")[0] : "";


    // null = cart popup closed, { top, right } = open at that place
    const [cartPosition, setCartPosition] = useState(null);


    // Open the cart card just under the cart button
    function toggleCart(event) {
        if (cartPosition) {
            setCartPosition(null);
            return;
        }

        const button = event.currentTarget.getBoundingClientRect();

        setCartPosition({
            top: button.bottom + 12,
            right: Math.max(10, window.innerWidth - button.right - 8)
        });
    }

    // useCallback keeps the same function, so the popup's Esc listener is not re-added every render
    const closeCart = useCallback(() => setCartPosition(null), []);


    function handleLogout() {
        logoutUser();
        clearCart();
        navigate("/login");
    }


    return (
        <nav className="nk-navbar navbar navbar-expand-lg navbar-dark sticky-top">
            <div className="container">
                <Link to="/home" className="navbar-brand">
                    <img src={logo} alt="Namma Kitchen" className="nk-nav-logo" />
                </Link>

                {/* Right side: cart + user (always visible, also on mobile) */}
                <div className="nk-nav-actions order-lg-3">
                    <button
                        type="button"
                        className="nk-cart-btn"
                        onClick={toggleCart}
                        aria-label="Cart"
                        aria-expanded={cartPosition !== null}
                    >
                        <i className="bi bi-cart3"></i>

                        {cartCount > 0 && (
                            <span className="nk-cart-badge">{cartCount}</span>
                        )}
                    </button>

                    {cartPosition && (
                        <CartPopup position={cartPosition} onClose={closeCart} />
                    )}

                    {user ? (
                        <div className="dropdown">
                            <button
                                className="nk-user-btn dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <i className="bi bi-person-circle"></i>
                                <span className="d-none d-sm-inline">{firstName}</span>
                            </button>

                            <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                    <Link to="/my-orders" className="dropdown-item">
                                        <i className="bi bi-bag me-2"></i>My Orders
                                    </Link>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    ) : (
                        <Link to="/login" className="nk-user-btn">
                            <i className="bi bi-person-circle"></i>
                            Login
                        </Link>
                    )}

                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#nkNavLinks"
                        aria-controls="nkNavLinks"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                </div>

                {/* Middle: page links (folds into a menu on mobile) */}
                <div className="collapse navbar-collapse" id="nkNavLinks">
                    <ul className="navbar-nav mx-auto">
                        <li className="nav-item">
                            <NavLink to="/home" className="nav-link">Home</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/menu" className="nav-link">Menu</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/my-orders" className="nav-link">My Orders</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/about" className="nav-link">About</NavLink>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
