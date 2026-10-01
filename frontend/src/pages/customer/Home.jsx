import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import CategoryCard from "../../components/CategoryCard";
import FoodCard from "../../components/FoodCard";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import EmptyState from "../../components/EmptyState";

import logo from "../../assets/logo.png";
import decoLeft from "../../assets/deco-tomato-left.png";
import decoRight from "../../assets/deco-tomato-right.png";
import { getCategories } from "../../services/categoryService";
import { getPopularFoods } from "../../services/foodService";

import "./customer.css";
import "./Home.css";


function Home() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesError, setCategoriesError] = useState("");

    const [popularFoods, setPopularFoods] = useState([]);
    const [foodsLoading, setFoodsLoading] = useState(true);
    const [foodsError, setFoodsError] = useState("");


    function loadCategories() {
        getCategories()
            .then((data) => setCategories(data))
            .catch((err) => setCategoriesError(err.message))
            .finally(() => setCategoriesLoading(false));
    }


    function loadPopularFoods() {
        getPopularFoods(4)
            .then((data) => setPopularFoods(data))
            .catch((err) => setFoodsError(err.message))
            .finally(() => setFoodsLoading(false));
    }


    // Load both sections once, when the page opens.
    // (loading already starts as true, so we do not set it here)
    useEffect(() => {
        loadCategories();
        loadPopularFoods();
    }, []);


    // "Try again" buttons: show the spinner again, then reload
    function retryCategories() {
        setCategoriesLoading(true);
        setCategoriesError("");
        loadCategories();
    }

    function retryPopularFoods() {
        setFoodsLoading(true);
        setFoodsError("");
        loadPopularFoods();
    }


    function openCategory(category) {
        navigate(`/menu?category_id=${category.id}`);
    }


    return (
        <div className="home-page customer-page">
            <Navbar />

            {/* ---------- Hero ---------- */}
            <section className="hero">
                <div className="container hero-inner">
                    <div className="hero-text">
                        <p className="hero-tagline">
                            GOOD FOOD <span>•</span> HAPPY PEOPLE
                        </p>

                        <img src={logo} alt="Namma Kitchen" className="hero-logo" />

                        <h1 className="hero-title">Delicious food, made for every moment</h1>

                        <p className="hero-subtitle">
                            Fresh ingredients, rich flavours and your favorite meals — all in one place.
                        </p>

                        <Link to="/menu" className="hero-btn">
                            Order Now <i className="bi bi-arrow-right"></i>
                        </Link>
                    </div>

                    <p className="hero-slogan">
                        Fresh<br />
                        Tasty<br />
                        Always<br />
                        Namma Style!
                    </p>
                </div>

                {/* Torn paper edge at the bottom of the hero */}
                <svg
                    className="hero-torn-edge"
                    viewBox="0 0 1440 40"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <path d="M0,22 L40,16 L75,24 L110,12 L150,20 L190,9 L230,18 L270,13 L310,24 L350,11 L395,19 L430,8 L470,17 L515,12 L555,23 L600,10 L640,18 L685,14 L725,25 L765,11 L810,19 L850,9 L890,20 L935,13 L975,22 L1015,10 L1060,18 L1100,12 L1140,24 L1185,11 L1225,19 L1265,8 L1310,17 L1350,13 L1395,22 L1440,14 L1440,40 L0,40 Z" />
                </svg>
            </section>

            {/* ---------- Food categories ---------- */}
            <section className="home-section" id="categories">
                {/* Decoration only, so alt="" (screen readers skip it) */}
                <img src={decoRight} alt="" className="page-deco home-deco-right" />

                <div className="container">
                    <div className="section-head">
                        <div>
                            <p className="section-eyebrow">EXPLORE OUR</p>
                            <h2 className="section-title">
                                Food <span>Categories</span>
                            </h2>
                        </div>

                        <Link to="/menu" className="section-link">
                            View All <i className="bi bi-arrow-right"></i>
                        </Link>
                    </div>

                    {categoriesLoading && <Loading message="Loading categories..." />}

                    {!categoriesLoading && categoriesError && (
                        <ErrorMessage message={categoriesError} onRetry={retryCategories} />
                    )}

                    {!categoriesLoading && !categoriesError && categories.length === 0 && (
                        <EmptyState icon="bi-grid" message="No categories yet." />
                    )}

                    {!categoriesLoading && !categoriesError && categories.length > 0 && (
                        <div className="category-grid">
                            {categories.map((category) => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    onClick={openCategory}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ---------- Most loved foods ---------- */}
            <section className="home-section" id="popular-foods">
                <img src={decoLeft} alt="" className="page-deco home-deco-left" />

                <div className="container">
                    <div className="section-head">
                        <div>
                            <p className="section-eyebrow">POPULAR DISHES</p>
                            <h2 className="section-title">
                                Most Loved <span>Foods</span>
                            </h2>
                        </div>

                        <Link to="/menu" className="section-link-outline">
                            View All <i className="bi bi-arrow-right"></i>
                        </Link>
                    </div>

                    {foodsLoading && <Loading message="Loading foods..." />}

                    {!foodsLoading && foodsError && (
                        <ErrorMessage message={foodsError} onRetry={retryPopularFoods} />
                    )}

                    {!foodsLoading && !foodsError && popularFoods.length === 0 && (
                        <EmptyState icon="bi-egg-fried" message="No foods available right now." />
                    )}

                    {!foodsLoading && !foodsError && popularFoods.length > 0 && (
                        <div className="food-grid">
                            {popularFoods.map((food) => (
                                <FoodCard key={food.id} food={food} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default Home;
