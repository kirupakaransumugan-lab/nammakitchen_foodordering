import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Eye, EyeOff, KeyRound, Power, Save, UserRound } from "lucide-react";

import OwnerLayout from "./OwnerLayout";
import { useLoad } from "./useLoad";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import { getRestaurant, setAcceptingOrders } from "../../services/ownerService";
import { changePassword, getCurrentUser, updateMyAccount } from "../../services/authService";
import { initials } from "../../utils/format";

import "../../components/Modal.css";   // .nk-field, .nk-btn
import "./OwnerDashboard.css";         // .panel
import "./Customers.css";              // .cust-hero, .cust-breadcrumb
import "./OwnerSettings.css";


const MIN_PASSWORD = 6;   // same as the backend


// Green "Saved." / red error line under a form
function FormMessage({ error, success }) {
    if (error) return <p className="nk-form-error">{error}</p>;
    if (success) return <p className="set-success">{success}</p>;
    return null;
}


// ---------- Online ordering on / off ----------

function OrderingPanel() {
    const [reload, setReload] = useState(0);
    const restaurant = useLoad(getRestaurant, `${reload}`);

    // null = use what the server said; true/false = the owner just changed it
    const [accepting, setAccepting] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const isOn = accepting ?? restaurant.data?.is_accepting_orders;


    async function toggle() {
        const next = !isOn;

        if (!next && !window.confirm("Pause online orders? Customers will not be able to order until you turn it back on.")) {
            return;
        }

        setSaving(true);
        setError("");

        try {
            const updated = await setAcceptingOrders(next);
            setAccepting(updated.is_accepting_orders);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }


    return (
        <section className="panel set-panel">
            <div className="panel-head">
                <h2><Power size={22} className="panel-icon" /> Online Ordering</h2>
            </div>

            {restaurant.loading && !restaurant.data && <Loading message="Loading..." />}
            {restaurant.error && <ErrorMessage message={restaurant.error} onRetry={() => setReload((n) => n + 1)} />}

            {restaurant.data && (
                <>
                    <div className={isOn ? "set-ordering on" : "set-ordering off"}>
                        <span className="set-ordering-dot" aria-hidden="true"></span>
                        <div>
                            <strong>{isOn ? "Taking orders" : "Orders paused"}</strong>
                            <small>
                                {isOn
                                    ? "Customers can place orders right now."
                                    : "Customers can see the menu but cannot place orders."}
                            </small>
                        </div>

                        <label className="form-check form-switch nk-switch set-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                checked={isOn}
                                disabled={saving}
                                onChange={toggle}
                                aria-label="Take online orders"
                            />
                        </label>
                    </div>

                    <p className="set-note">
                        Use this when the kitchen is too busy or closed for the day.
                        Orders already placed are not affected.
                    </p>
                    <FormMessage error={error} />
                </>
            )}
        </section>
    );
}


// ---------- Name, phone, address ----------

function AccountPanel({ user, onSaved }) {
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone || "");
    const [address, setAddress] = useState(user.address || "");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    async function handleSubmit(event) {
        event.preventDefault();

        if (name.trim().length < 2) {
            setError("Your name needs at least 2 letters.");
            return;
        }
        if (phone.trim().length < 7) {
            setError("Please enter a valid phone number.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const updated = await updateMyAccount({
                name: name.trim(),
                phone: phone.trim(),
                address: address.trim() || null
            });
            setSuccess("Account details saved.");
            onSaved(updated);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }


    return (
        <section className="panel set-panel">
            <div className="panel-head">
                <h2><UserRound size={22} className="panel-icon" /> Account Details</h2>
            </div>

            <div className="set-profile">
                <span className="set-avatar">{initials(name || user.name)}</span>
                <div>
                    <strong>{name.trim() || user.name}</strong>
                    <small>Restaurant Owner · {user.email}</small>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="nk-field-row">
                    <label className="nk-field">
                        <span>Full Name</span>
                        <input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
                    </label>
                    <label className="nk-field">
                        <span>Phone</span>
                        <input type="tel" value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} />
                    </label>
                </div>

                <label className="nk-field">
                    <span>Email</span>
                    <input value={user.email} disabled />
                    <small className="set-hint">Your login email cannot be changed here.</small>
                </label>

                <label className="nk-field">
                    <span>Address</span>
                    <input
                        value={address}
                        maxLength={255}
                        placeholder="Optional"
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </label>

                <FormMessage error={error} success={success} />

                <div className="set-actions">
                    <button type="submit" className="nk-btn nk-btn-primary" disabled={saving}>
                        <Save size={18} /> {saving ? "Saving..." : "Save Details"}
                    </button>
                </div>
            </form>
        </section>
    );
}


// ---------- Password ----------

function PasswordInput({ label, value, onChange, show, autoComplete }) {
    return (
        <label className="nk-field">
            <span>{label}</span>
            <input
                type={show ? "text" : "password"}
                value={value}
                autoComplete={autoComplete}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    );
}


function PasswordPanel() {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [show, setShow] = useState(false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    async function handleSubmit(event) {
        event.preventDefault();
        setSuccess("");

        if (!current) {
            setError("Please enter your current password.");
            return;
        }
        if (next.length < MIN_PASSWORD) {
            setError(`The new password needs at least ${MIN_PASSWORD} characters.`);
            return;
        }
        if (next !== confirm) {
            setError("The new passwords do not match.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            await changePassword(current, next);
            setCurrent("");
            setNext("");
            setConfirm("");
            setSuccess("Password changed. Use the new password next time you log in.");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }


    return (
        <section className="panel set-panel">
            <div className="panel-head">
                <h2><KeyRound size={22} className="panel-icon" /> Change Password</h2>
                <button
                    type="button"
                    className="set-show"
                    onClick={() => setShow(!show)}
                    aria-pressed={show}
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />} {show ? "Hide" : "Show"}
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <PasswordInput
                    label="Current Password" value={current} onChange={setCurrent}
                    show={show} autoComplete="current-password"
                />
                <PasswordInput
                    label="New Password" value={next} onChange={setNext}
                    show={show} autoComplete="new-password"
                />
                <PasswordInput
                    label="Confirm New Password" value={confirm} onChange={setConfirm}
                    show={show} autoComplete="new-password"
                />
                <small className="set-hint set-hint-gap">At least {MIN_PASSWORD} characters.</small>

                <FormMessage error={error} success={success} />

                <div className="set-actions">
                    <button type="submit" className="nk-btn nk-btn-primary" disabled={saving}>
                        <KeyRound size={18} /> {saving ? "Changing..." : "Change Password"}
                    </button>
                </div>
            </form>
        </section>
    );
}


function OwnerSettings() {
    // Bumped after saving, so the top bar reads the new name from storage
    const [, setVersion] = useState(0);
    const user = getCurrentUser();

    const hero = (
        <div className="cust-hero">
            <div>
                <nav className="cust-breadcrumb" aria-label="Breadcrumb">
                    <Link to="/owner">Home</Link>
                    <ChevronRight size={16} />
                    <span>Settings</span>
                </nav>
                <h1>Settings</h1>
                <p>Online ordering, your account and your password</p>
            </div>

            <p className="owner-hero-quote" aria-hidden="true">
                Happy Kitchen<br />Happy Owner
            </p>
        </div>
    );

    return (
        <OwnerLayout light hero={hero}>
            <div className="set-layout">
                <div className="set-column">
                    <OrderingPanel />
                    <AccountPanel user={user} onSaved={() => setVersion((n) => n + 1)} />
                </div>
                <div className="set-column">
                    <PasswordPanel />
                </div>
            </div>
        </OwnerLayout>
    );
}

export default OwnerSettings;
