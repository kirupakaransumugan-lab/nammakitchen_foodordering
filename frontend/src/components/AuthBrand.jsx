import logo from "../assets/logo.png";


// Left side of the Login / Register page: logo + taglines
function AuthBrand() {
    return (
        <div className="auth-brand">
            <img src={logo} alt="Namma Kitchen" className="brand-logo-img" />

            <p className="brand-tagline">
                GOOD FOOD <span className="brand-dot">•</span> HAPPY PEOPLE
            </p>

            <p className="brand-slogan">
                Fresh<br />
                Tasty<br />
                Always<br />
                Namma Style!
            </p>
        </div>
    );
}

export default AuthBrand;
