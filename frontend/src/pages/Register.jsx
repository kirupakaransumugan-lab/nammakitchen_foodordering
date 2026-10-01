import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthBrand from "../components/AuthBrand";
import AuthInput from "../components/AuthInput";
import SocialLogin from "../components/SocialLogin";
import { registerUser } from "../services/authService";

import "./auth.css";


// Check the form before sending it to the backend.
// Return an error message (string), or "" if everything is OK.
function validateRegisterForm(form) {
    // TODO(human): check the form fields and return the first error message
    return "";
}


function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
    });

    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);


    // One change handler for all inputs, using the input "name"
    function handleChange(event) {
        setForm({
            ...form,
            [event.target.name]: event.target.value
        });
    }


    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setInfo("");

        const message = validateRegisterForm(form);

        if (message) {
            setError(message);
            return;
        }

        setLoading(true);

        try {
            // confirmPassword is only for the frontend, so we do not send it
            await registerUser({
                name: form.name,
                email: form.email,
                phone: form.phone,
                password: form.password
            });

            navigate("/login", {
                state: { message: "Account created successfully. Please login." }
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }


    function showComingSoon(name) {
        setError("");
        setInfo(`${name} sign up is coming soon. Please use the form.`);
    }


    return (
        <div className="auth-page">
            <div className="auth-container">
                <AuthBrand />

                <div className="auth-card">
                    <h1 className="auth-title">
                        Create Your <span>Account</span>
                    </h1>

                    <p className="auth-subtitle">
                        Join Namma Kitchen and enjoy delicious food at your fingertips.
                    </p>

                    {error && <div className="auth-alert auth-alert-error">{error}</div>}
                    {info && <div className="auth-alert auth-alert-info">{info}</div>}

                    <form onSubmit={handleSubmit} noValidate>
                        <AuthInput
                            icon="bi-person"
                            name="name"
                            placeholder="Full Name"
                            value={form.name}
                            onChange={handleChange}
                        />

                        <AuthInput
                            icon="bi-envelope"
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={form.email}
                            onChange={handleChange}
                        />

                        <AuthInput
                            icon="bi-telephone"
                            type="tel"
                            name="phone"
                            placeholder="Phone Number"
                            value={form.phone}
                            onChange={handleChange}
                        />

                        <AuthInput
                            icon="bi-lock"
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={handleChange}
                        />

                        <AuthInput
                            icon="bi-lock"
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                        />

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? "Creating account..." : "Register"}
                            {!loading && <i className="bi bi-arrow-right"></i>}
                        </button>
                    </form>

                    <SocialLogin onClick={showComingSoon} />

                    <p className="auth-switch">
                        Already have an account?
                        <Link to="/login" className="auth-link">Login Now</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
