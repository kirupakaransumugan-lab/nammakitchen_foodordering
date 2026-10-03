import { useEffect, useRef, useState } from "react";
import { ImagePlus, Save, X } from "lucide-react";

import { createFood, updateFood, uploadImage } from "../../services/ownerService";

import "../../components/Modal.css";   // .nk-field, .nk-btn
import "./FoodForm.css";


const MAX_IMAGE_SIZE = 2 * 1024 * 1024;   // 2 MB, same as the backend
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DESCRIPTION_MAX = 500;


// "" -> null, "30" -> 30  (for the optional number boxes)
function optionalNumber(text) {
    return String(text).trim() === "" ? null : Number(text);
}

// null -> "", 30 -> "30"  (to fill the boxes when editing)
function toText(value) {
    return value === null || value === undefined ? "" : String(value);
}


// Add a new food, or edit one when "food" is given.
// Only the form itself: the page puts it in a side panel or a popup.
//   defaultCategoryId: the category to pick first when adding
function FoodForm({ food, categories, defaultCategoryId, onCancel, onSaved }) {
    const firstCategory = defaultCategoryId || categories[0]?.id || "";

    // "" until the owner picks one; then the first category is used (it may load later)
    const [pickedCategoryId, setCategoryId] = useState(food?.category_id || "");
    const categoryId = pickedCategoryId || firstCategory;
    const [name, setName] = useState(food?.name || "");
    const [description, setDescription] = useState(food?.description || "");
    const [price, setPrice] = useState(toText(food?.price));
    const [discountPrice, setDiscountPrice] = useState(toText(food?.discount_price));
    const [prepTime, setPrepTime] = useState(toText(food?.prep_time));
    const [calories, setCalories] = useState(toText(food?.calories));
    const [isAvailable, setIsAvailable] = useState(food ? food.is_available : true);

    // image = the saved photo URL; file = a new photo picked but not uploaded yet
    const [image, setImage] = useState(food?.image || "");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fileInput = useRef(null);


    // A preview URL holds the photo in memory, so free it when it is not shown anymore
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);


    function handleFileChange(event) {
        const chosen = event.target.files[0];
        event.target.value = "";   // lets the owner pick the same file again

        if (!chosen) return;

        if (!IMAGE_TYPES.includes(chosen.type)) {
            setError("Please choose a JPG, PNG or WEBP image.");
            return;
        }

        if (chosen.size > MAX_IMAGE_SIZE) {
            setError("The image must be 2 MB or smaller.");
            return;
        }

        setError("");
        setFile(chosen);
        setPreview(URL.createObjectURL(chosen));
    }

    function removeImage() {
        setFile(null);
        setPreview("");
        setImage("");
    }


    async function handleSubmit(event) {
        event.preventDefault();

        if (!categoryId) {
            setError("Please add a category first.");
            return;
        }

        if (name.trim().length < 2) {
            setError("The name needs at least 2 letters.");
            return;
        }

        if (!(Number(price) > 0)) {
            setError("Please enter a price above 0.");
            return;
        }

        const discount = optionalNumber(discountPrice);
        if (discount !== null && !(discount > 0 && discount < Number(price))) {
            setError("The discount price must be above 0 and lower than the price.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            // Upload the new photo only now, so a cancelled form leaves no file behind
            let imageUrl = image || null;
            if (file) {
                const uploaded = await uploadImage(file);
                imageUrl = uploaded.url;
            }

            const data = {
                category_id: Number(categoryId),
                name: name.trim(),
                description: description.trim(),
                price: Number(price),
                discount_price: discount,
                prep_time: optionalNumber(prepTime),
                calories: optionalNumber(calories),
                image: imageUrl,
                is_available: isAvailable
            };

            if (food) {
                await updateFood(food.id, data);
            } else {
                await createFood(data);
            }
            onSaved();
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    }


    const shownImage = preview || image;

    return (
        <form className="food-form" onSubmit={handleSubmit}>
            {/* ---------- Photo ---------- */}
            <div className={shownImage ? "food-upload has-image" : "food-upload"}>
                {shownImage ? (
                    <>
                        <img src={shownImage} alt="Food preview" />
                        <div className="food-upload-actions">
                            <button type="button" onClick={() => fileInput.current.click()}>
                                Change
                            </button>
                            <button type="button" onClick={removeImage} aria-label="Remove image">
                                <X size={16} />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <ImagePlus size={34} className="food-upload-icon" />
                        <strong>Upload Food Image</strong>
                        <small>JPG, PNG, WEBP (Max 2MB)</small>
                        <button type="button" className="food-upload-btn" onClick={() => fileInput.current.click()}>
                            Choose Image
                        </button>
                    </>
                )}

                <input
                    ref={fileInput}
                    type="file"
                    accept={IMAGE_TYPES.join(",")}
                    onChange={handleFileChange}
                    hidden
                />
            </div>

            {/* ---------- Details ---------- */}
            <label className="nk-field">
                <span>Food Name <b className="req">*</b></span>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={150}
                    placeholder="e.g. Chicken Biryani"
                />
            </label>

            <label className="nk-field">
                <span>Category <b className="req">*</b></span>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    {categories.length === 0 && <option value="">No categories yet</option>}
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </label>

            <label className="nk-field">
                <span>Description</span>
                <textarea
                    rows={3}
                    maxLength={DESCRIPTION_MAX}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write a short description about this food..."
                />
                <small className="food-form-count">{description.length}/{DESCRIPTION_MAX}</small>
            </label>

            <div className="nk-field-row">
                <label className="nk-field">
                    <span>Price (Rs.) <b className="req">*</b></span>
                    <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                    />
                </label>

                <label className="nk-field">
                    <span>Discount Price (Rs.)</span>
                    <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={discountPrice}
                        onChange={(e) => setDiscountPrice(e.target.value)}
                        placeholder="0.00"
                    />
                    <small className="food-form-hint">Leave empty if no discount</small>
                </label>
            </div>

            <div className="nk-field-row">
                <label className="nk-field">
                    <span>Preparation Time (mins)</span>
                    <input
                        type="number"
                        min="1"
                        max="300"
                        value={prepTime}
                        onChange={(e) => setPrepTime(e.target.value)}
                        placeholder="e.g. 30"
                    />
                </label>

                <label className="nk-field">
                    <span>Calories (kcal)</span>
                    <input
                        type="number"
                        min="0"
                        max="5000"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        placeholder="e.g. 320"
                    />
                </label>
            </div>

            <label className="food-form-toggle">
                <span className="form-check form-switch nk-switch">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                    />
                </span>
                <span>
                    <strong>Available for Order</strong>
                    <small>Customers can see and order this item</small>
                </span>
            </label>

            {error && <p className="nk-form-error">{error}</p>}

            <div className="food-form-actions">
                <button type="button" className="nk-btn nk-btn-light" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="nk-btn nk-btn-primary" disabled={saving}>
                    <Save size={18} /> {saving ? "Saving..." : food ? "Save Changes" : "Save Item"}
                </button>
            </div>
        </form>
    );
}

export default FoodForm;
