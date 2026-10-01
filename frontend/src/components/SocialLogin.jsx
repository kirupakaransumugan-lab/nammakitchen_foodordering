// "OR" line + Google / Microsoft buttons.
// Social login is not built yet, so the buttons just show a message.
function SocialLogin({ onClick }) {
    return (
        <>
            <div className="auth-divider">OR</div>

            <div className="social-buttons">
                <button
                    type="button"
                    className="social-btn"
                    onClick={() => onClick("Google")}
                >
                    <i className="bi bi-google google-icon"></i>
                    Continue with Google
                </button>

                <button
                    type="button"
                    className="social-btn"
                    onClick={() => onClick("Microsoft")}
                >
                    <span className="ms-logo">
                        <span className="ms-red"></span>
                        <span className="ms-green"></span>
                        <span className="ms-blue"></span>
                        <span className="ms-yellow"></span>
                    </span>
                    Continue with Microsoft
                </button>
            </div>
        </>
    );
}

export default SocialLogin;
