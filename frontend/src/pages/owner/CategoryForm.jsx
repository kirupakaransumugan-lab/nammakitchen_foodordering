import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import Modal from "../../components/Modal";
import { createCategory, updateCategory, uploadImage } from "../../services/ownerService";

import "./FoodForm.css";   // .food-upload photo box


const MAX_IMAGE_SIZE = 2 * 1024 * 1024;   // 2 MB, same as the backend
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];


// Add a new category, or edit one when "category" is given
function CategoryForm({ category, onClose, onSaved }) {
    const [name, setName] = useState(category?.name || "");
    const [description, setDescription] = useState(category?.description || "");
    // image = a link (saved, or typed by the owner); file = a photo picked but not uploaded yet
    const [image, setImage] = useState(category?.image || "");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [badLink, setBadLink] = useState(false);   // the link did not load as a picture

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

        // A picked photo replaces any typed link
        setError("");
        setFile(chosen);
        setPreview(URL.createObjectURL(chosen));
        setImage("");
        setBadLink(false);
    }

    function handleLinkChange(value) {
        // A typed link replaces any picked photo
        setImage(value);
        setFile(null);
        setPreview("");
        setBadLink(false);
    }

    function removeImage() {
        handleLinkChange("");
    }


    async function handleSubmit(event) {
        event.preventDefault();

        if (name.trim().length < 2) {
            setError("The name needs at least 2 letters.");
            return;
        }

        if (badLink) {
            setError("That link is not a picture. Upload an image, or use a link that ends in .jpg / .png / .webp.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            // Upload the new photo only now, so a cancelled form leaves nothing behind
            const imageUrl = file ? (await uploadImage(file)).url : image.trim();

            const data = {
                name: name.trim(),
                description: description.trim(),
                image: imageUrl || null
            };

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


    const shownImage = preview || image.trim();

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

                {/* ---------- Photo: upload, or paste a link ---------- */}
                <div className="nk-field">
                    <span>Image (optional)</span>
                    <div className={shownImage && !badLink ? "food-upload cat-upload has-image" : "food-upload cat-upload"}>
                        {shownImage && !badLink ? (
                            <>
                                <img src={shownImage} alt="Category preview" onError={() => setBadLink(true)} />
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
                                <ImagePlus size={30} className="food-upload-icon" />
                                <strong>Upload Category Image</strong>
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
                </div>

                <label className="nk-field">
                    <span>Or paste an image link</span>
                    <input
                        value={image}
                        onChange={(e) => handleLinkChange(e.target.value)}
                        maxLength={255}
                        placeholder={file ? "Using the uploaded photo" : "https://.../photo.jpg"}
                    />
                    {badLink && (
                        <small className="cat-link-error">
                            This link did not load as a picture. Use a direct image link (right-click an image → &quot;Copy image address&quot;).
                        </small>
                    )}
                </label>

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
