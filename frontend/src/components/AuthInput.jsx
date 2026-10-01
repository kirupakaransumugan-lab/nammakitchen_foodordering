import { useState } from "react";


// One input box with an icon on the left.
// If type is "password", it also shows an eye button to show/hide the text.
function AuthInput({ label, icon, type = "text", name, placeholder, value, onChange }) {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";

    let inputType = type;
    if (isPassword && showPassword) {
        inputType = "text";
    }

    return (
        <div className="auth-field">
            {label && (
                <label className="auth-label" htmlFor={name}>
                    {label}
                </label>
            )}

            <div className="auth-input-wrap">
                <i className={`bi ${icon} auth-input-icon`}></i>

                <input
                    id={name}
                    className="auth-input"
                    type={inputType}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                />

                {isPassword && (
                    <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        <i className={showPassword ? "bi bi-eye" : "bi bi-eye-slash"}></i>
                    </button>
                )}
            </div>
        </div>
    );
}

export default AuthInput;
