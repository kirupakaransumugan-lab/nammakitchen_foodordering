import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    ChevronRight,
    Clock,
    ImagePlus,
    Mail,
    MapPin,
    Phone,
    Save,
    Store,
    X
} from "lucide-react";

import OwnerLayout from "./OwnerLayout";
import { useLoad } from "./useLoad";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import { getRestaurant, updateRestaurant, uploadImage } from "../../services/ownerService";

import "../../components/Modal.css";   // .nk-field, .nk-btn
import "./OwnerDashboard.css";         // .panel
import "./Customers.css";              // .cust-hero, .cust-breadcrumb
import "./FoodForm.css";               // .food-upload, .food-form-count
import "./RestaurantProfile.css";


const MAX_IMAGE_SIZE = 2 * 1024 * 1024;   // 2 MB, same as the backend
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DESCRIPTION_MAX = 1000;

// The boxes on the form; null from the backend -> ""
const FIELDS = ["name", "tagline", "description", "phone", "email", "address", "open_time", "close_time"];


// "21:30" -> "9:30 PM"
function formatClock(time) {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}


// Open right now? Works for late nights too (open 18:00, close 02:00).
function isOpenNow(openTime, closeTime) {
    if (!openTime || !closeTime) return null;   // hours not set

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    if (openTime <= closeTime) {
        return current >= openTime && current < closeTime;
    }
    return current >= openTime || current < closeTime;
}


// Photo box. src = the photo to show (saved or newly picked), "" = empty box
function PhotoField({ label, hint, src, onPick, onRemove, onError, round }) {
    const input = useRef(null);

    function handleChange(event) {
        const chosen = event.target.files[0];
        event.target.value = "";   // lets the owner pick the same file again

        if (!chosen) return;

        if (!IMAGE_TYPES.includes(chosen.type)) {
            onError("Please choose a JPG, PNG or WEBP image.");
            return;
        }
        if (chosen.size > MAX_IMAGE_SIZE) {
            onError("The image must be 2 MB or smaller.");
            return;
        }
        onPick(chosen);
    }

    return (
        <div className="nk-field">
            <span>{label}</span>
            <div className={`food-upload rp-upload${round ? " round" : ""}${src ? " has-image" : ""}`}>
                {src ? (
                    <>
                        <img src={src} alt={`${label} preview`} />
                        <div className="food-upload-actions">
                            <button type="button" onClick={() => input.current.click()}>Change</button>
                            <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}>
                                <X size={16} />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <ImagePlus size={28} className="food-upload-icon" />
                        <small>{hint}</small>
                        <button type="button" className="food-upload-btn" onClick={() => input.current.click()}>
                            Choose Image
                        </button>
                    </>
                )}
                <input ref={input} type="file" accept={IMAGE_TYPES.join(",")} onChange={handleChange} hidden />
            </div>
        </div>
    );
}


// How customers see the restaurant (updates while the owner types)
function ProfilePreview({ form, logo, cover, accepting }) {
    const open = isOpenNow(form.open_time, form.close_time);
    const hasContact = (form.open_time && form.close_time) || form.phone.trim() || form.email.trim() || form.address.trim();

    let status = { text: "Hours not set", cls: "unknown" };
    if (!accepting) status = { text: "Not taking orders", cls: "closed" };
    else if (open === true) status = { text: "Open now", cls: "open" };
    else if (open === false) status = { text: "Closed now", cls: "closed" };

    return (
        <div className="rp-preview">
            <div className="rp-cover" style={cover ? { backgroundImage: `url("${cover}")` } : undefined}>
                <span className={`rp-status ${status.cls}`}>{status.text}</span>
            </div>

            <div className="rp-preview-body">
                <div className="rp-logo">
                    {logo ? <img src={logo} alt="" /> : <Store size={34} />}
                </div>

                <h3>{form.name.trim() || "Restaurant name"}</h3>
                {form.tagline.trim() && <p className="rp-tagline">{form.tagline}</p>}
                {form.description.trim() && <p className="rp-about">{form.description}</p>}

                {hasContact && <ul className="rp-contact">
                    {form.open_time && form.close_time && (
                        <li><Clock size={17} /> {formatClock(form.open_time)} – {formatClock(form.close_time)}</li>
                    )}
                    {form.phone.trim() && <li><Phone size={17} /> {form.phone}</li>}
                    {form.email.trim() && <li><Mail size={17} /> {form.email}</li>}
                    {form.address.trim() && <li><MapPin size={17} /> {form.address}</li>}
                </ul>}
            </div>
        </div>
    );
}


// A newly picked photo: the file (uploaded on Save) + a preview URL for it
const NO_PHOTO = { file: null, preview: "" };

function pickPhoto(file) {
    return { file: file, preview: URL.createObjectURL(file) };
}


function ProfileForm({ restaurant }) {
    const [form, setForm] = useState(() => {
        const start = {};
        for (const key of FIELDS) start[key] = restaurant[key] || "";
        return start;
    });

    // Saved photo URLs, and newly picked photos (uploaded on Save)
    const [logo, setLogo] = useState(restaurant.logo || "");
    const [cover, setCover] = useState(restaurant.cover_image || "");
    const [newLogo, setNewLogo] = useState(NO_PHOTO);
    const [newCover, setNewCover] = useState(NO_PHOTO);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);

    // A preview URL holds the photo in memory, so free it when it is not shown anymore
    useEffect(() => () => newLogo.preview && URL.revokeObjectURL(newLogo.preview), [newLogo]);
    useEffect(() => () => newCover.preview && URL.revokeObjectURL(newCover.preview), [newCover]);

    const logoSrc = newLogo.preview || logo;
    const coverSrc = newCover.preview || cover;


    function change(key, value) {
        setForm((old) => ({ ...old, [key]: value }));
        setSaved(false);
    }


    async function handleSubmit(event) {
        event.preventDefault();

        if (form.name.trim().length < 2) {
            setError("The restaurant name needs at least 2 letters.");
            return;
        }

        if (Boolean(form.open_time) !== Boolean(form.close_time)) {
            setError("Please set both the opening and the closing time, or neither.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            // Upload new photos only now, so a cancelled change leaves nothing behind
            const logoUrl = newLogo.file ? (await uploadImage(newLogo.file)).url : logo;
            const coverUrl = newCover.file ? (await uploadImage(newCover.file)).url : cover;

            const updated = await updateRestaurant({
                ...form,
                email: form.email.trim() || null,
                open_time: form.open_time || null,
                close_time: form.close_time || null,
                logo: logoUrl || null,
                cover_image: coverUrl || null
            });

            setLogo(updated.logo || "");
            setCover(updated.cover_image || "");
            setNewLogo(NO_PHOTO);
            setNewCover(NO_PHOTO);
            setSaved(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }


    return (
        <div className="rp-layout">
            <form className="panel rp-form" onSubmit={handleSubmit}>
                <div className="panel-head">
                    <h2><Store size={22} className="panel-icon" /> Restaurant Details</h2>
                </div>

                <div className="rp-photos">
                    <PhotoField
                        label="Logo"
                        hint="Square, JPG / PNG / WEBP, max 2MB"
                        src={logoSrc}
                        onPick={(f) => { setNewLogo(pickPhoto(f)); setSaved(false); setError(""); }}
                        onRemove={() => { setNewLogo(NO_PHOTO); setLogo(""); setSaved(false); }}
                        onError={setError}
                        round
                    />
                    <PhotoField
                        label="Cover Photo"
                        hint="Wide photo, JPG / PNG / WEBP, max 2MB"
                        src={coverSrc}
                        onPick={(f) => { setNewCover(pickPhoto(f)); setSaved(false); setError(""); }}
                        onRemove={() => { setNewCover(NO_PHOTO); setCover(""); setSaved(false); }}
                        onError={setError}
                    />
                </div>

                <label className="nk-field">
                    <span>Restaurant Name <b className="req">*</b></span>
                    <input value={form.name} maxLength={100} onChange={(e) => change("name", e.target.value)} />
                </label>

                <label className="nk-field">
                    <span>Tagline</span>
                    <input
                        value={form.tagline}
                        maxLength={150}
                        placeholder="e.g. Fresh. Tasty. Always Namma Style!"
                        onChange={(e) => change("tagline", e.target.value)}
                    />
                </label>

                <label className="nk-field">
                    <span>About the Restaurant</span>
                    <textarea
                        rows={4}
                        maxLength={DESCRIPTION_MAX}
                        value={form.description}
                        placeholder="Tell customers what makes your kitchen special..."
                        onChange={(e) => change("description", e.target.value)}
                    />
                    <small className="food-form-count">{form.description.length}/{DESCRIPTION_MAX}</small>
                </label>

                <h3 className="rp-section">Contact</h3>

                <div className="nk-field-row">
                    <label className="nk-field">
                        <span>Phone</span>
                        <input
                            type="tel"
                            value={form.phone}
                            maxLength={20}
                            placeholder="e.g. 077 123 4567"
                            onChange={(e) => change("phone", e.target.value)}
                        />
                    </label>
                    <label className="nk-field">
                        <span>Email</span>
                        <input
                            type="email"
                            value={form.email}
                            maxLength={150}
                            placeholder="hello@nammakitchen.com"
                            onChange={(e) => change("email", e.target.value)}
                        />
                    </label>
                </div>

                <label className="nk-field">
                    <span>Address</span>
                    <input
                        value={form.address}
                        maxLength={255}
                        placeholder="Street, city"
                        onChange={(e) => change("address", e.target.value)}
                    />
                </label>

                <h3 className="rp-section">Opening Hours</h3>

                <div className="nk-field-row">
                    <label className="nk-field">
                        <span>Opens at</span>
                        <input type="time" value={form.open_time} onChange={(e) => change("open_time", e.target.value)} />
                    </label>
                    <label className="nk-field">
                        <span>Closes at</span>
                        <input type="time" value={form.close_time} onChange={(e) => change("close_time", e.target.value)} />
                    </label>
                </div>
                <small className="food-form-hint rp-hint">
                    Closing after midnight is fine (e.g. 6:00 PM – 2:00 AM).
                </small>

                {error && <p className="nk-form-error">{error}</p>}
                {saved && !error && <p className="rp-saved">Profile saved.</p>}

                <div className="rp-actions">
                    <button type="submit" className="nk-btn nk-btn-primary" disabled={saving}>
                        <Save size={18} /> {saving ? "Saving..." : "Save Profile"}
                    </button>
                </div>
            </form>

            <aside className="rp-side">
                <p className="rp-side-label">Customer preview</p>
                <ProfilePreview
                    form={form}
                    logo={logoSrc}
                    cover={coverSrc}
                    accepting={restaurant.is_accepting_orders}
                />
                <p className="rp-side-note">
                    Pause or resume online orders in <Link to="/owner/settings">Settings</Link>.
                </p>
            </aside>
        </div>
    );
}


function RestaurantProfile() {
    const [reload, setReload] = useState(0);
    const restaurant = useLoad(getRestaurant, `${reload}`);

    const hero = (
        <div className="cust-hero">
            <div>
                <nav className="cust-breadcrumb" aria-label="Breadcrumb">
                    <Link to="/owner">Home</Link>
                    <ChevronRight size={16} />
                    <span>Restaurant Profile</span>
                </nav>
                <h1>Restaurant Profile</h1>
                <p>Your restaurant&apos;s name, photos, contact details and hours</p>
            </div>

            <p className="owner-hero-quote" aria-hidden="true">
                Fresh. Tasty.<br />Namma Style!
            </p>
        </div>
    );

    return (
        <OwnerLayout light hero={hero}>
            {restaurant.loading && !restaurant.data && <div className="panel"><Loading message="Loading profile..." /></div>}
            {restaurant.error && (
                <div className="panel">
                    <ErrorMessage message={restaurant.error} onRetry={() => setReload((n) => n + 1)} />
                </div>
            )}
            {restaurant.data && <ProfileForm restaurant={restaurant.data} />}
        </OwnerLayout>
    );
}

export default RestaurantProfile;
