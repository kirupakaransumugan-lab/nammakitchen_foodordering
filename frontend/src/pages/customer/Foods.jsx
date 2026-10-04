import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    List,
    Search,
    UtensilsCrossed
} from "lucide-react";

import Navbar from "../../components/Navbar";
import FoodCard from "../../components/FoodCard";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import EmptyState from "../../components/EmptyState";

import decoLeft from "../../assets/deco-tomato-left.png";
import decoRight from "../../assets/deco-tomato-right.png";
import { getCategories } from "../../services/categoryService";
import { getFoods } from "../../services/foodService";

import "./customer.css";
import "./Foods.css";


const FOODS_PER_PAGE = 12;

// The "Sort by" dropdown. Each option = what we send to /api/foods
const SORT_OPTIONS = [
    { key: "popular", label: "Popular", sort: "popular", order: "desc" },
    { key: "price-asc", label: "Price: Low to High", sort: "price", order: "asc" },
    { key: "price-desc", label: "Price: High to Low", sort: "price", order: "desc" },
    { key: "name", label: "Name: A to Z", sort: "name", order: "asc" },
    { key: "newest", label: "Newest", sort: "newest", order: "desc" }
];

// Sidebar icon: the image the owner gave the category,
// or a plain plate icon when there is none or it cannot load.
function CategoryIcon({ category }) {
    const [broken, setBroken] = useState(false);

    if (category.image && !broken) {
        return <img src={category.image} alt="" className="menu-cat-img" onError={() => setBroken(true)} />;
    }

    return <UtensilsCrossed size={22} strokeWidth={1.6} />;
}


function Foods() {
    // The category lives in the URL (/menu?category_id=2),
    // so the Home page category cards can open the menu already filtered.
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryId = searchParams.get("category_id") || "";

    const [categories, setCategories] = useState([]);

    const [searchText, setSearchText] = useState("");   // what is typed in the box
    const [search, setSearch] = useState("");           // what we really search for
    const [sortKey, setSortKey] = useState("popular");
    const [page, setPage] = useState(1);
    const [view, setView] = useState("grid");
    const [retryCount, setRetryCount] = useState(0);

    // The last answer from the backend, and which request it belongs to
    const [result, setResult] = useState({ key: "", data: null, error: "" });


    const sortOption = SORT_OPTIONS.find((option) => option.key === sortKey);

    const filters = {
        search: search,
        category_id: categoryId,
        sort: sortOption.sort,
        order: sortOption.order,
        page: page,
        limit: FOODS_PER_PAGE
    };

    // If the saved answer is for other filters, the new one is still loading
    const filtersKey = JSON.stringify(filters);
    const requestKey = filtersKey + "#" + retryCount;
    const loading = result.key !== requestKey;
    const foodPage = result.data;


    // Categories for the sidebar (once)
    useEffect(() => {
        getCategories()
            .then((data) => setCategories(data))
            .catch(() => setCategories([]));
    }, []);


    // Wait until the user stops typing for a moment, then search.
    // Without this we would call the backend on every key press.
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchText.trim());
            setPage(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [searchText]);


    // Load foods every time a filter changes
    useEffect(() => {
        // If the filters change again before this answer comes back,
        // "ignore" stops the old answer from replacing the new one.
        let ignore = false;

        getFoods(JSON.parse(filtersKey))
            .then((data) => {
                if (!ignore) setResult({ key: requestKey, data: data, error: "" });
            })
            .catch((err) => {
                if (!ignore) setResult({ key: requestKey, data: null, error: err.message });
            });

        return () => {
            ignore = true;
        };
    }, [filtersKey, requestKey]);


    function changeCategory(id) {
        setPage(1);
        setSearchParams(id ? { category_id: id } : {});
    }

    function changeSort(event) {
        setSortKey(event.target.value);
        setPage(1);
    }

    function changePage(newPage) {
        setPage(newPage);
        window.scrollTo({ top: 300, behavior: "smooth" });
    }


    const activeCategory = categories.find((c) => String(c.id) === categoryId);


    return (
        <div className="menu-page customer-page">
            <Navbar />

            {/* ---------- Hero ---------- */}
            <section className="page-hero">
                <div className="container">
                    <h1 className="brush-title">
                        <span className="brush-title-white">Our</span>{" "}
                        <span className="brush-title-orange">Menu</span>
                    </h1>
                </div>

                <svg
                    className="hero-torn-edge"
                    viewBox="0 0 1440 40"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <path d="M0,22 L40,16 L75,24 L110,12 L150,20 L190,9 L230,18 L270,13 L310,24 L350,11 L395,19 L430,8 L470,17 L515,12 L555,23 L600,10 L640,18 L685,14 L725,25 L765,11 L810,19 L850,9 L890,20 L935,13 L975,22 L1015,10 L1060,18 L1100,12 L1140,24 L1185,11 L1225,19 L1265,8 L1310,17 L1350,13 L1395,22 L1440,14 L1440,40 L0,40 Z" />
                </svg>
            </section>

            {/* ---------- Sidebar + foods ---------- */}
            <section className="menu-body">
                <img src={decoRight} alt="" className="page-deco menu-deco-right" />
                <img src={decoLeft} alt="" className="page-deco menu-deco-left" />

                <div className="container menu-layout">
                    <aside className="menu-sidebar">
                        <button
                            type="button"
                            className={categoryId === "" ? "menu-cat active" : "menu-cat"}
                            onClick={() => changeCategory("")}
                        >
                            <UtensilsCrossed size={22} strokeWidth={1.6} />
                            <span>All Menu</span>
                            <ChevronRight size={18} className="menu-cat-arrow" />
                        </button>

                        {categories.map((category) => {
                            const isActive = String(category.id) === categoryId;

                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    className={isActive ? "menu-cat active" : "menu-cat"}
                                    onClick={() => changeCategory(category.id)}
                                >
                                    <CategoryIcon category={category} />
                                    <span>{category.name}</span>
                                    <ChevronRight size={18} className="menu-cat-arrow" />
                                </button>
                            );
                        })}
                    </aside>

                    <div className="menu-main">
                        {/* Search, sort and grid/list buttons */}
                        <div className="menu-toolbar">
                            <label className="menu-search">
                                <Search size={18} />
                                <input
                                    type="search"
                                    placeholder="Search for food..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </label>

                            <label className="menu-sort">
                                <span>Sort by:</span>
                                <select value={sortKey} onChange={changeSort}>
                                    {SORT_OPTIONS.map((option) => (
                                        <option key={option.key} value={option.key}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="menu-view-btns">
                                <button
                                    type="button"
                                    className={view === "grid" ? "active" : ""}
                                    onClick={() => setView("grid")}
                                    aria-label="Grid view"
                                >
                                    <LayoutGrid size={20} />
                                </button>
                                <button
                                    type="button"
                                    className={view === "list" ? "active" : ""}
                                    onClick={() => setView("list")}
                                    aria-label="List view"
                                >
                                    <List size={20} />
                                </button>
                            </div>
                        </div>

                        {loading && <Loading message="Loading menu..." />}

                        {!loading && result.error && (
                            <ErrorMessage
                                message={result.error}
                                onRetry={() => setRetryCount(retryCount + 1)}
                            />
                        )}

                        {!loading && !result.error && foodPage.items.length === 0 && (
                            <EmptyState
                                icon="bi-search"
                                message={
                                    search
                                        ? `No foods found for "${search}".`
                                        : "No foods in this category yet."
                                }
                            />
                        )}

                        {!loading && !result.error && foodPage.items.length > 0 && (
                            <>
                                <p className="menu-count">
                                    {foodPage.total} {foodPage.total === 1 ? "dish" : "dishes"}
                                    {activeCategory && <> in <strong>{activeCategory.name}</strong></>}
                                </p>

                                <div className={view === "list" ? "food-grid menu-grid list-view" : "food-grid menu-grid"}>
                                    {foodPage.items.map((food) => (
                                        <FoodCard key={food.id} food={food} />
                                    ))}
                                </div>

                                {foodPage.total_pages > 1 && (
                                    <nav className="menu-pagination" aria-label="Pages">
                                        <button
                                            type="button"
                                            disabled={page === 1}
                                            onClick={() => changePage(page - 1)}
                                            aria-label="Previous page"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>

                                        {Array.from({ length: foodPage.total_pages }, (_, i) => i + 1).map((number) => (
                                            <button
                                                key={number}
                                                type="button"
                                                className={number === page ? "active" : ""}
                                                onClick={() => changePage(number)}
                                            >
                                                {number}
                                            </button>
                                        ))}

                                        <button
                                            type="button"
                                            disabled={page === foodPage.total_pages}
                                            onClick={() => changePage(page + 1)}
                                            aria-label="Next page"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </nav>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Foods;
