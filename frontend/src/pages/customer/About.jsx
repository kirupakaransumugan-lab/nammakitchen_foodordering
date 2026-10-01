import { Link } from "react-router-dom";

import Navbar from "../../components/Navbar";
import heroBackground from "../../assets/auth-bg.png";
import foodBackground from "../../assets/hero-bg.png";
import pizzaImage from "../../assets/about-pizza.png";
import biryaniImage from "../../assets/about-biryani.png";
import drinksImage from "../../assets/about-drinks.png";
import decoLeft from "../../assets/deco-tomato-left.png";
import decoRight from "../../assets/deco-tomato-right.png";

import "./customer.css";
import "./About.css";


const promises = [
    { icon: "bi-emoji-heart-eyes", title: "Quality Food", text: "Prepared with care, every time." },
    { icon: "bi-flower1", title: "Fresh Ingredients", text: "Honest ingredients and bold flavour." },
    { icon: "bi-people", title: "For Food Lovers", text: "Made for every kind of craving." },
    { icon: "bi-egg-fried", title: "Great Taste", text: "Comfort food worth coming back for." }
];


function About() {
    return (
        <div className="about-page customer-page">
            <Navbar />

            <main>
                <section className="about-hero" style={{ "--about-hero": `url(${heroBackground})` }}>
                    <div className="container about-hero-content">
                        <p className="about-kicker">THE NAMMA KITCHEN STORY</p>
                        <h1 className="about-title">
                            <span>About</span> <em>Us</em>
                        </h1>
                        <p className="about-intro">
                            A neighbourhood kitchen serving comforting favourites with fresh ingredients,
                            generous flavour, and a little extra care.
                        </p>
                        <Link to="/home#popular-foods" className="about-hero-button">
                            Explore our food <i className="bi bi-arrow-right"></i>
                        </Link>
                    </div>
                    <svg className="about-torn-edge" viewBox="0 0 1440 52" preserveAspectRatio="none" aria-hidden="true">
                        <path d="M0,28 L45,17 L90,29 L132,14 L182,24 L226,11 L273,22 L320,14 L370,31 L420,16 L468,25 L520,10 L568,22 L618,13 L670,29 L722,15 L772,26 L826,11 L878,24 L929,15 L982,30 L1035,12 L1084,25 L1134,13 L1182,29 L1232,16 L1286,26 L1334,11 L1388,23 L1440,14 L1440,52 L0,52 Z" />
                    </svg>
                </section>

                <section className="about-story-section">
                    <img src={decoLeft} alt="" className="page-deco about-deco-left" />
                    <img src={decoRight} alt="" className="page-deco about-deco-right" />

                    <div className="container">
                        <div className="about-story-grid">
                            <div className="about-food-photo" style={{ "--food-image": `url(${pizzaImage})` }}>
                                <div className="about-photo-frame"></div>
                                <span className="about-photo-label">Made with love</span>
                            </div>

                            <div className="about-copy">
                                <p className="section-eyebrow">WHY WE DO IT</p>
                                <h2>Good food brings <span>people together.</span></h2>
                                <p>
                                    Namma Kitchen began with a simple belief: a great meal can turn an ordinary
                                    moment into a memorable one. We make ordering your favourites easy, while
                                    keeping the warmth of a meal made just for you.
                                </p>
                                <p>
                                    From familiar classics to new cravings, every dish is selected to make your day
                                    a little more delicious.
                                </p>
                                <Link to="/home#categories" className="about-text-link">
                                    Browse categories <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>
                        </div>

                        <div className="about-promises" aria-label="What Namma Kitchen stands for">
                            {promises.map((promise) => (
                                <article className="about-promise-card" key={promise.title}>
                                    <i className={`bi ${promise.icon}`} aria-hidden="true"></i>
                                    <h3>{promise.title}</h3>
                                    <p>{promise.text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="about-moments">
                    <div className="container">
                        <div className="about-moments-heading">
                            <p className="section-eyebrow">FROM OUR KITCHEN</p>
                            <h2>Fresh moments, <span>full flavour.</span></h2>
                        </div>
                        <div className="about-gallery">
                            <div className="about-gallery-card about-gallery-produce" style={{ "--gallery-image": `url(${biryaniImage})` }} />
                            <div className="about-gallery-card about-gallery-kitchen" style={{ "--gallery-image": `url(${drinksImage})` }} />
                            <div className="about-gallery-card about-gallery-flavour" style={{ "--gallery-image": `url(${foodBackground})` }} />
                        </div>
                        <div className="about-cta">
                            <div>
                                <p>Hungry already?</p>
                                <h2>Your next favourite meal is waiting.</h2>
                            </div>
                            <Link to="/home#popular-foods" className="about-order-button">
                                Order now <i className="bi bi-bag-heart"></i>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default About;
