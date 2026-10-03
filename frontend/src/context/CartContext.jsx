import { createContext, useContext, useEffect, useState } from "react";


const CartContext = createContext(null);


// Read the saved cart when the page loads
function loadCart() {
    try {
        const saved = localStorage.getItem("cart");
        const items = saved ? JSON.parse(saved) : [];

        // Carts saved before options existed have no key: give them one
        return items.map((item) => ({
            options: [],
            note: "",
            key: String(item.id),
            ...item
        }));
    } catch {
        return [];
    }
}


// One cart line = one food with one set of choices.
// "Small pizza" and "Large pizza + cheese" are 2 lines, so each needs its own key.
function makeKey(foodId, options, note) {
    const optionIds = options.map((option) => option.id).sort((a, b) => a - b);
    return `${foodId}|${optionIds.join(",")}|${note}`;
}


export function CartProvider({ children }) {
    // Each item:
    // { key, id, name, image, price, quantity, note,
    //   options: [{ id, group, name, extra_price }] }
    // "price" is for ONE item, with the options already added.
    const [cartItems, setCartItems] = useState(loadCart);

    // Save the cart every time it changes, so a refresh does not empty it
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);


    // choices: { quantity, options, note } (all optional)
    function addToCart(food, choices = {}) {
        const quantity = choices.quantity || 1;
        const options = choices.options || [];
        const note = (choices.note || "").trim();
        const key = makeKey(food.id, options, note);

        let price = Number(food.price);
        for (const option of options) {
            price += Number(option.extra_price);
        }

        // "current" = the latest cart, even if two adds happen quickly
        setCartItems((current) => {
            const existing = current.find((item) => item.key === key);

            if (existing) {
                return current.map((item) =>
                    item.key === key ? { ...item, quantity: item.quantity + quantity } : item
                );
            }

            const newItem = {
                key: key,
                id: food.id,
                name: food.name,
                image: food.image,
                price: price,
                quantity: quantity,
                options: options,
                note: note
            };

            return [...current, newItem];
        });
    }


    function increaseQuantity(key) {
        setCartItems((current) =>
            current.map((item) =>
                item.key === key ? { ...item, quantity: item.quantity + 1 } : item
            )
        );
    }


    function decreaseQuantity(key) {
        setCartItems((current) =>
            current
                .map((item) =>
                    item.key === key ? { ...item, quantity: item.quantity - 1 } : item
                )
                .filter((item) => item.quantity > 0)
        );
    }


    function removeFromCart(key) {
        setCartItems((current) => current.filter((item) => item.key !== key));
    }


    function clearCart() {
        setCartItems([]);
    }


    // Total number of items, e.g. 2 pizzas + 1 burger = 3
    function getCartCount() {
        let count = 0;

        for (const item of cartItems) {
            count += item.quantity;
        }

        return count;
    }


    // Only for showing on screen. The backend calculates the real total.
    function getTotal() {
        let total = 0;

        for (const item of cartItems) {
            total += item.price * item.quantity;
        }

        return total;
    }


    const value = {
        cartItems,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        getCartCount,
        getTotal
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}


// Use this in any page: const { addToCart } = useCart();
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
    return useContext(CartContext);
}
