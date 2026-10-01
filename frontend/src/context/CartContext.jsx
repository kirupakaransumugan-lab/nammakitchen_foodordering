import { createContext, useContext, useEffect, useState } from "react";


const CartContext = createContext(null);


// Read the saved cart when the page loads
function loadCart() {
    try {
        const saved = localStorage.getItem("cart");
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}


export function CartProvider({ children }) {
    // Each item: { id, name, price, image, quantity }
    const [cartItems, setCartItems] = useState(loadCart);

    // Save the cart every time it changes, so a refresh does not empty it
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);


    function addToCart(food) {
        const existing = cartItems.find((item) => item.id === food.id);

        if (existing) {
            increaseQuantity(food.id);
            return;
        }

        const newItem = {
            id: food.id,
            name: food.name,
            price: food.price,
            image: food.image,
            quantity: 1
        };

        setCartItems([...cartItems, newItem]);
    }


    function increaseQuantity(foodId) {
        setCartItems(
            cartItems.map((item) =>
                item.id === foodId ? { ...item, quantity: item.quantity + 1 } : item
            )
        );
    }


    function decreaseQuantity(foodId) {
        setCartItems(
            cartItems
                .map((item) =>
                    item.id === foodId ? { ...item, quantity: item.quantity - 1 } : item
                )
                .filter((item) => item.quantity > 0)
        );
    }


    function removeFromCart(foodId) {
        setCartItems(cartItems.filter((item) => item.id !== foodId));
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
