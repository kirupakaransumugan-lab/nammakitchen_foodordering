import { useState } from "react";

import FoodModal from "./FoodModal";
import { formatPrice } from "../utils/format";

import "./Cards.css";


function FoodCard({ food }) {
    const [liked, setLiked] = useState(false);

    // "Add" opens the popup, where the customer picks size, toppings, ...
    const [showModal, setShowModal] = useState(false);


    return (
        <div className="food-card">
            <div className="food-card-img">
                <button
                    type="button"
                    className="food-card-img-btn"
                    onClick={() => setShowModal(true)}
                    aria-label={`Open ${food.name}`}
                >
                    {food.image ? (
                        <img src={food.image} alt={food.name} />
                    ) : (
                        <span className="img-placeholder">
                            <i className="bi bi-image"></i>
                        </span>
                    )}
                </button>

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
                    className="food-add-btn"
                    onClick={() => setShowModal(true)}
                >
                    <i className="bi bi-cart3"></i>
                    Add
                </button>
            </div>

            {showModal && (
                <FoodModal
                    food={food}
                    liked={liked}
                    onToggleLike={() => setLiked(!liked)}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}

export default FoodCard;
