import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Minus, Pencil, Plus, ShoppingCart, X } from "lucide-react";

import { useCart } from "../context/CartContext";
import { getFoodById } from "../services/foodService";
import { formatPrice } from "../utils/format";

import "./FoodModal.css";


const MAX_QUANTITY = 50;


// Every required "pick one" group starts with its first option picked
// (e.g. Size = Small), so the customer can add to cart straight away.
function defaultSelection(groups) {
    const selected = {};

    for (const group of groups) {
        const firstOption = group.options[0];
        selected[group.id] =
            group.selection === "single" && group.is_required && firstOption
                ? [firstOption.id]
                : [];
    }

    return selected;
}


// "+Rs. 250", or nothing for a free option
function extraText(amount) {
    return amount > 0 ? "+" + formatPrice(amount) : "";
}


// The "Add to cart" popup. "food" is the food from the card;
// the options and extra photos are loaded when the popup opens.
function FoodModal({ food, liked, onToggleLike, onClose }) {
    const { addToCart } = useCart();

    const [detail, setDetail] = useState(null);
    const [loadError, setLoadError] = useState("");

    const [selected, setSelected] = useState({});   // group id -> [option ids]
    const [imageIndex, setImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState("");
    const [added, setAdded] = useState(false);


    useEffect(() => {
        getFoodById(food.id)
            .then((data) => {
                setDetail(data);
                setSelected(defaultSelection(data.option_groups));
            })
            .catch((err) => setLoadError(err.message));
    }, [food.id]);


    // Close with the Esc key, and stop the page behind from scrolling
    useEffect(() => {
        function handleKey(event) {
            if (event.key === "Escape") onClose();
        }

        document.addEventListener("keydown", handleKey);
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = oldOverflow;
        };
    }, [onClose]);


    // Until the details arrive, show what the card already knows
    const shownFood = detail || food;
    const groups = detail ? detail.option_groups : [];

    const photos = [food.image, ...(detail ? detail.images.map((img) => img.url) : [])].filter(Boolean);
    const mainPhoto = photos[imageIndex] || photos[0];

    // The first "pick one" group (usually Size) gets the big cards with full prices
    const bigCardGroup = groups.find((group) => group.selection === "single");


    // Picked options as objects, in the order the groups are shown
    const pickedOptions = [];
    for (const group of groups) {
        for (const option of group.options) {
            if ((selected[group.id] || []).includes(option.id)) {
                pickedOptions.push({
                    id: option.id,
                    group: group.name,
                    name: option.name,
                    extra_price: option.extra_price
                });
            }
        }
    }

    let unitPrice = Number(shownFood.price);
    for (const option of pickedOptions) {
        unitPrice += Number(option.extra_price);
    }

    const missingGroup = groups.find(
        (group) => group.is_required && (selected[group.id] || []).length === 0
    );


    function toggleOption(group, optionId) {
        const current = selected[group.id] || [];
        let next;

        if (group.selection === "single") {
            // Clicking the picked option again un-picks it (only if not required)
            next = current.includes(optionId) && !group.is_required ? [] : [optionId];
        } else {
            next = current.includes(optionId)
                ? current.filter((id) => id !== optionId)
                : [...current, optionId];
        }

        setSelected({ ...selected, [group.id]: next });
    }


    function handleAdd() {
        addToCart(shownFood, { quantity, options: pickedOptions, note });

        // Show "Added" for a moment, then close
        setAdded(true);
        setTimeout(onClose, 700);
    }


    function isPicked(group, option) {
        return (selected[group.id] || []).includes(option.id);
    }


    return createPortal(
        <div className="food-modal-overlay" onClick={onClose}>
            <div
                className="food-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="food-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ---------- Left: photos ---------- */}
                <div className="food-modal-gallery">
                    <div className="food-modal-photo">
                        {mainPhoto ? (
                            <img src={mainPhoto} alt={shownFood.name} />
                        ) : (
                            <span className="img-placeholder">
                                <i className="bi bi-image"></i>
                            </span>
                        )}

                        <button
                            type="button"
                            className="food-like-btn"
                            onClick={onToggleLike}
                            aria-label={liked ? "Remove from favourites" : "Add to favourites"}
                        >
                            <i className={liked ? "bi bi-heart-fill" : "bi bi-heart"}></i>
                        </button>
                    </div>

                    {photos.length > 1 && (
                        <div className="food-modal-thumbs">
                            {photos.map((url, index) => (
                                <button
                                    key={url + index}
                                    type="button"
                                    className={index === imageIndex ? "active" : ""}
                                    onClick={() => setImageIndex(index)}
                                    aria-label={`Photo ${index + 1}`}
                                >
                                    <img src={url} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ---------- Right: details + choices ---------- */}
                <div className="food-modal-body">
                    <div className="food-modal-scroll">
                        <div className="food-modal-head">
                            <h2 id="food-modal-title">{shownFood.name}</h2>

                            <button type="button" className="food-modal-close" onClick={onClose} aria-label="Close">
                                <X size={22} />
                            </button>
                        </div>

                        <p className="food-modal-price">{formatPrice(unitPrice)}</p>

                        {shownFood.description && (
                            <p className="food-modal-desc">{shownFood.description}</p>
                        )}

                        {!detail && !loadError && (
                            <div className="food-modal-loading">
                                <div className="spinner-border spinner-border-sm"></div> Loading options...
                            </div>
                        )}

                        {loadError && <p className="food-modal-error">{loadError}</p>}

                        {groups.map((group) => (
                            <fieldset key={group.id} className="food-modal-group">
                                <legend>
                                    {group.name}
                                    {!group.is_required && group.selection === "multiple" && (
                                        <span> (Optional)</span>
                                    )}
                                </legend>

                                {/* Big cards: e.g. Small / Medium / Large with full prices */}
                                {group === bigCardGroup && (
                                    <div className="option-cards">
                                        {group.options.map((option) => (
                                            <button
                                                key={option.id}
                                                type="button"
                                                className={isPicked(group, option) ? "option-card active" : "option-card"}
                                                onClick={() => toggleOption(group, option.id)}
                                                aria-pressed={isPicked(group, option)}
                                            >
                                                {option.image && <img src={option.image} alt="" />}
                                                <strong>{option.name}</strong>
                                                <span>{formatPrice(Number(shownFood.price) + Number(option.extra_price))}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Chips: other "pick one" groups, e.g. crust type */}
                                {group !== bigCardGroup && group.selection === "single" && (
                                    <div className="option-chips">
                                        {group.options.map((option) => (
                                            <button
                                                key={option.id}
                                                type="button"
                                                className={isPicked(group, option) ? "option-chip active" : "option-chip"}
                                                onClick={() => toggleOption(group, option.id)}
                                                aria-pressed={isPicked(group, option)}
                                            >
                                                {option.image && <img src={option.image} alt="" />}
                                                {option.name}
                                                {option.extra_price > 0 && (
                                                    <small>{extraText(option.extra_price)}</small>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Checkboxes: "pick any", e.g. extra toppings */}
                                {group.selection === "multiple" && (
                                    <div className="option-checks">
                                        {group.options.map((option) => (
                                            <label
                                                key={option.id}
                                                className={isPicked(group, option) ? "option-check active" : "option-check"}
                                            >
                                                {option.image && <img src={option.image} alt="" />}
                                                <span className="option-check-name">{option.name}</span>
                                                <small>{extraText(option.extra_price)}</small>
                                                <input
                                                    type="checkbox"
                                                    checked={isPicked(group, option)}
                                                    onChange={() => toggleOption(group, option.id)}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </fieldset>
                        ))}

                        <label className="food-modal-group food-modal-note">
                            <span className="food-modal-label">Special Instructions (Optional)</span>
                            <span className="food-modal-note-box">
                                <Pencil size={15} />
                                <input
                                    type="text"
                                    maxLength={255}
                                    placeholder="e.g. less cheese, no onion, extra spicy..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </span>
                        </label>
                    </div>

                    {/* ---------- Bottom: quantity + add ---------- */}
                    <div className="food-modal-footer">
                        <div className="qty-stepper">
                            <button
                                type="button"
                                onClick={() => setQuantity(quantity - 1)}
                                disabled={quantity <= 1}
                                aria-label="Less"
                            >
                                <Minus size={16} />
                            </button>
                            <span aria-live="polite">{quantity}</span>
                            <button
                                type="button"
                                className="plus"
                                onClick={() => setQuantity(quantity + 1)}
                                disabled={quantity >= MAX_QUANTITY}
                                aria-label="More"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <button
                            type="button"
                            className={added ? "food-modal-add added" : "food-modal-add"}
                            onClick={handleAdd}
                            disabled={!detail || Boolean(missingGroup) || added}
                            title={missingGroup ? `Please pick a ${missingGroup.name}` : ""}
                        >
                            {added ? (
                                <><Check size={20} /> Added</>
                            ) : (
                                <><ShoppingCart size={20} /> Add to Cart <span>•</span> {formatPrice(unitPrice * quantity)}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default FoodModal;
