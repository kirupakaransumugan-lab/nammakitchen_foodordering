import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthBrand from "../components/AuthBrand";
import AuthInput from "../components/AuthInput";
import SocialLogin from "../components/SocialLogin";
import { loginUser, getHomePathForRole } from "../services/authService";

import "./auth.css";


function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    // Message sent from the Register page after a successful sign up
    const successMessage = location.state?.message;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);


    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setInfo("");

        if (!email || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            const user = await loginUser(email, password);
            navigate(getHomePathForRole(user.role));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }


    function showComingSoon(name) {
        setError("");
        setInfo(`${name} login is coming soon. Please use email and password.`);
    }


    return (
        <div className="auth-page">
            <div className="auth-container">
                <AuthBrand />

                <div className="auth-card">
                    <h1 className="auth-title">
                        Welcome <span>Back!</span>
                    </h1>

                    <p className="auth-subtitle">
                        Login to your Namma Kitchen account
                    </p>

                    {successMessage && !error && (
                        <div className="auth-alert auth-alert-success">{successMessage}</div>
                    )}

                    {error && <div className="auth-alert auth-alert-error">{error}</div>}
                    {info && <div className="auth-alert auth-alert-info">{info}</div>}

                    <form onSubmit={handleSubmit} noValidate>
                        <AuthInput
                            label="Email Address"
                            icon="bi-envelope"
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <AuthInput
                            label="Password"
                            icon="bi-lock"
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <div className="auth-forgot">
                            <button
                                type="button"
                                className="auth-link"
                                onClick={() => showComingSoon("Forgot password")}
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                            {!loading && <i className="bi bi-arrow-right"></i>}
                        </button>
                    </form>

                    <SocialLogin onClick={showComingSoon} />

                    <p className="auth-switch">
                        Don't have an account?
                        <Link to="/register" className="auth-link">Register Now</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
