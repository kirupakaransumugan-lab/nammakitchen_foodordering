import { useState } from "react";

import Modal from "../../components/Modal";
import { createCategory, updateCategory } from "../../services/ownerService";


// Add a new category, or edit one when "category" is given
function CategoryForm({ category, onClose, onSaved }) {
    const [name, setName] = useState(category?.name || "");
    const [description, setDescription] = useState(category?.description || "");
    const [image, setImage] = useState(category?.image || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");


    async function handleSubmit(event) {
        event.preventDefault();

        if (name.trim().length < 2) {
            setError("The name needs at least 2 letters.");
            return;
        }

        const data = {
            name: name.trim(),
            description: description.trim(),
            image: image.trim() || null
        };

        setSaving(true);
        setError("");

        try {
            if (category) {
                await updateCategory(category.id, data);
            } else {
                await createCategory(data);
            }
            onSaved();
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    }


    return (
        <Modal title={category ? "Edit Category" : "Add Category"} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <label className="nk-field">
                    <span>Name</span>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        placeholder="e.g. Pizza"
                        autoFocus
                    />
                </label>

                <label className="nk-field">
                    <span>Description (optional)</span>
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Cheesy, hot and fresh from the oven"
                    />
                </label>

                <label className="nk-field">
                    <span>Image URL (optional)</span>
                    <input
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        maxLength={255}
                        placeholder="https://..."
                    />
                </label>

                {image.trim() && (
                    <div className="nk-image-preview">
                        <img src={image.trim()} alt="Preview" />
                    </div>
                )}

                {error && <p className="nk-form-error">{error}</p>}

                <div className="nk-form-actions">
                    <button type="button" className="nk-btn nk-btn-light" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="nk-btn nk-btn-primary" disabled={saving}>
                        {saving ? "Saving..." : category ? "Save Changes" : "Add Category"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default CategoryForm;
