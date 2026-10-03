import { Minus, Plus, Trash2 } from "lucide-react";

import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";


// One line in the cart popup: photo, name, choices, quantity, price
function CartItem({ item }) {
    const { increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

    const choices = item.options.map((option) => option.name).join(", ");


    return (
        <li className="cart-item">
            <div className="cart-item-img">
                {item.image ? (
                    <img src={item.image} alt="" />
                ) : (
                    <span className="img-placeholder">
                        <i className="bi bi-image"></i>
                    </span>
                )}
            </div>

            <div className="cart-item-info">
                <p className="cart-item-name">{item.name}</p>

                {(choices || item.note) && (
                    <p className="cart-item-choices">
                        {choices}
                        {choices && item.note && " · "}
                        {item.note && <em>{item.note}</em>}
                    </p>
                )}

                <div className="cart-item-row">
                    <div className="cart-qty">
                        <button
                            type="button"
                            onClick={() => decreaseQuantity(item.key)}
                            aria-label={`One less ${item.name}`}
                        >
                            <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                            type="button"
                            onClick={() => increaseQuantity(item.key)}
                            aria-label={`One more ${item.name}`}
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <span className="cart-item-price">{formatPrice(item.price * item.quantity)}</span>
                </div>
            </div>

            <button
                type="button"
                className="cart-item-remove"
                onClick={() => removeFromCart(item.key)}
                aria-label={`Remove ${item.name}`}
            >
                <Trash2 size={16} />
            </button>
        </li>
    );
}

export default CartItem;
