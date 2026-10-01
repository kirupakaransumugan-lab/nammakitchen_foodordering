import { useState } from "react";

import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";

import "./Cards.css";


function FoodCard({ food }) {
    const { addToCart } = useCart();

    const [liked, setLiked] = useState(false);
    const [justAdded, setJustAdded] = useState(false);


    function handleAdd() {
        addToCart(food);

        // Show "Added" for 1 second, then go back to "Add"
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1000);
    }


    return (
        <div className="food-card">
            <div className="food-card-img">
                {food.image ? (
                    <img src={food.image} alt={food.name} />
                ) : (
                    <span className="img-placeholder">
                        <i className="bi bi-image"></i>
                    </span>
                )}

                <button
                    type="button"
                    className="food-like-btn"
                    onClick={() => setLiked(!liked)}
                    aria-label={liked ? "Remove from favourites" : "Add to favourites"}
                >
                    <i className={liked ? "bi bi-heart-fill" : "bi bi-heart"}></i>
                </button>
            </div>

            <div className="food-card-body">
                <div className="food-card-info">
                    <h3 className="food-card-name">{food.name}</h3>
                    <p className="food-card-desc">{food.description}</p>
                    <p className="food-card-price">{formatPrice(food.price)}</p>
                </div>

                <button
                    type="button"
                    className={justAdded ? "food-add-btn added" : "food-add-btn"}
                    onClick={handleAdd}
                >
                    <i className={justAdded ? "bi bi-check-lg" : "bi bi-cart3"}></i>
                    {justAdded ? "Added" : "Add"}
                </button>
            </div>
        </div>
    );
}

export default FoodCard;
