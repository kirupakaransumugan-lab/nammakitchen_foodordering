import { useEffect, useRef, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    CircleOff,
    Clock,
    EllipsisVertical,
    Flame,
    LayoutGrid,
    List,
    ListChecks,
    Pencil,
    Plus,
    Star,
    Store,
    Trash2,
    UtensilsCrossed
} from "lucide-react";

import OwnerLayout from "./OwnerLayout";
import CategoryForm from "./CategoryForm";
import FoodForm from "./FoodForm";
import { useLoad } from "./useLoad";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import {
    deleteCategory,
    deleteFood,
    getOwnerCategories,
    getOwnerFoods,
    updateFood
} from "../../services/ownerService";
import { formatPrice } from "../../utils/format";

import "./OwnerDashboard.css";   // .panel, .thumb, .nk-switch, .table-pages, .dash-notice
import "./MenuManagement.css";


const FOODS_PER_PAGE = 10;

// The tabs under the title
const TABS = [
    { key: "all", label: "All Items", icon: ListChecks },
    { key: "available", label: "Available", icon: CircleCheck },
    { key: "unavailable", label: "Unavailable", icon: CircleOff },
    { key: "best", label: "Best Sellers", icon: Star }
];

// The "Sort" box -> what the backend needs
const SORTS = {
    newest: { label: "Newest", sort: "newest", order: "desc" },
    name: { label: "Name (A-Z)", sort: "name", order: "asc" },
    "price-asc": { label: "Price: Low to High", sort: "price", order: "asc" },
    "price-desc": { label: "Price: High to Low", sort: "price", order: "desc" }
};


function Thumb({ src, className = "" }) {
    return src ? (
        <img src={src} alt="" className={`thumb ${className}`} />
    ) : (
        <span className={`thumb thumb-empty ${className}`}><i className="bi bi-image"></i></span>
    );
}


// Normal price, or the sale price with the old price crossed out
function Price({ food }) {
    if (food.discount_price) {
        return (
            <span className="menu-price">
                {formatPrice(food.discount_price)}
                <del>{formatPrice(food.price)}</del>
            </span>
        );
    }

    return <span className="menu-price">{formatPrice(food.price)}</span>;
}


function MenuManagement() {
    const [tab, setTab] = useState("all");
    const [categoryId, setCategoryId] = useState(null);   // null = all categories
    const [sortKey, setSortKey] = useState("newest");
    const [view, setView] = useState("list");
    const [page, setPage] = useState(1);

    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");

    // Add 1 to load everything again after a change
    const [reload, setReload] = useState(0);
    const refresh = () => setReload((n) => n + 1);

    // The side form: editing = null -> "Add", a food -> "Edit".
    // formKey makes a brand new (empty) form after a save or cancel.
    const [editing, setEditing] = useState(null);
    const [formKey, setFormKey] = useState(0);

    const [categoryForm, setCategoryForm] = useState(null);   // null | { category }
    const [busyId, setBusyId] = useState(null);
    const [notice, setNotice] = useState("");

    const formPanel = useRef(null);


    // "Best Sellers" always shows the most sold first
    const sort = tab === "best" ? { sort: "popular", order: "desc" } : SORTS[sortKey];
    const available = tab === "available" ? true : tab === "unavailable" ? false : "";

    const categories = useLoad(getOwnerCategories, `${reload}`);
    const foods = useLoad(
        () => getOwnerFoods({
            search,
            category_id: categoryId,
            available,
            sort: sort.sort,
            order: sort.order,
            page,
            limit: FOODS_PER_PAGE
        }),
        `${search}|${categoryId}|${available}|${sort.sort}|${sort.order}|${page}|${reload}`
    );


    // Search after the owner stops typing for a moment
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchText.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchText]);

    // Hide the message after 4 seconds
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 4000);
        return () => clearTimeout(timer);
    }, [notice]);


    // Every filter change starts again from page 1
    function changeFilter(setter, value) {
        setter(value);
        setPage(1);
    }

    // On smaller screens the form is under the lists, so bring it into view
    function showForm() {
        if (window.innerWidth < 1400) {
            formPanel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function startAdd() {
        setEditing(null);
        setFormKey((k) => k + 1);
        showForm();
    }

    function startEdit(food) {
        setEditing(food);
        showForm();
    }

    function handleFormSaved() {
        setNotice(editing ? `"${editing.name}" saved.` : "Food item added.");
        setEditing(null);
        setFormKey((k) => k + 1);
        refresh();
    }

    function handleFormCancel() {
        setEditing(null);
        setFormKey((k) => k + 1);
    }


    // Runs a change (toggle, delete, ...), then reloads, or shows the error
    async function runAction(id, action, doneMessage) {
        setBusyId(id);
        try {
            await action();
            refresh();
            if (doneMessage) setNotice(doneMessage);
        } catch (err) {
            setNotice(err.message);
        } finally {
            setBusyId(null);
        }
    }

    function handleToggleFood(food) {
        runAction(
            `food-${food.id}`,
            () => updateFood(food.id, { is_available: !food.is_available }),
            `"${food.name}" is now ${food.is_available ? "unavailable" : "available"}.`
        );
    }

    function handleDeleteFood(food) {
        if (!window.confirm(`Delete "${food.name}"?`)) return;
        if (editing?.id === food.id) handleFormCancel();
        runAction(`food-${food.id}`, () => deleteFood(food.id), `"${food.name}" deleted.`);
    }

    function handleDeleteCategory(category) {
        if (!window.confirm(`Delete the "${category.name}" category?`)) return;
        runAction(`cat-${category.id}`, async () => {
            await deleteCategory(category.id);
            if (categoryId === category.id) changeFilter(setCategoryId, null);
        }, `"${category.name}" deleted.`);
    }


    const categoryList = categories.data || [];
    const selectedCategory = categoryList.find((c) => c.id === categoryId);
    const totalFoods = categoryList.reduce((sum, c) => sum + c.food_count, 0);
    const foodData = foods.data;


    const hero = (
        <div className="menu-hero">
            <div className="menu-hero-text">
                <p className="menu-eyebrow">Menu Management</p>
                <h1>Food Menu</h1>
                <p>Add, edit and organize your delicious menu items</p>
            </div>

            <p className="owner-hero-quote" aria-hidden="true">
                Good Food<br />Brings People<br />Together
            </p>

            <div className="menu-hero-bar">
                <div className="menu-tabs" role="tablist" aria-label="Show">
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={tab === t.key}
                                className={tab === t.key ? "menu-tab active" : "menu-tab"}
                                onClick={() => changeFilter(setTab, t.key)}
                            >
                                <Icon size={16} /> {t.label}
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    className="menu-add-btn"
                    onClick={startAdd}
                    disabled={categoryList.length === 0}
                    title={categories.data && categoryList.length === 0 ? "Add a category first" : ""}
                >
                    <Plus size={18} /> Add Food Item
                </button>
            </div>
        </div>
    );


    return (
        <OwnerLayout
            light
            hero={hero}
            search={searchText}
            onSearchChange={setSearchText}
            searchPlaceholder="Search food items..."
        >
            <div className="menu-layout">
                {/* ---------- Categories ---------- */}
                <section className="panel menu-categories">
                    <div className="panel-head">
                        <h2><UtensilsCrossed size={22} className="panel-icon" /> Food Categories</h2>
                        <button
                            type="button"
                            className="menu-round-btn"
                            onClick={() => setCategoryForm({ category: null })}
                            aria-label="Add category"
                            title="Add category"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {!categories.data && categories.loading && <Loading message="Loading categories..." />}
                    {categories.error && <ErrorMessage message={categories.error} onRetry={refresh} />}

                    {categories.data && categoryList.length === 0 && (
                        <p className="panel-empty">No categories yet. Add your first one with the + button.</p>
                    )}

                    {categoryList.length > 0 && (
                        <ul className="menu-category-list">
                            <li>
                                <button
                                    type="button"
                                    className={categoryId === null ? "menu-category active" : "menu-category"}
                                    onClick={() => changeFilter(setCategoryId, null)}
                                >
                                    <span className="thumb thumb-empty menu-category-thumb"><Store size={20} /></span>
                                    <span className="menu-category-text">
                                        <strong>All Categories</strong>
                                        <small>{totalFoods} {totalFoods === 1 ? "item" : "items"}</small>
                                    </span>
                                </button>
                            </li>

                            {categoryList.map((category) => (
                                <li key={category.id} className="menu-category-row">
                                    <button
                                        type="button"
                                        className={categoryId === category.id ? "menu-category active" : "menu-category"}
                                        onClick={() => changeFilter(setCategoryId, category.id)}
                                    >
                                        <Thumb src={category.image} className="menu-category-thumb" />
                                        <span className="menu-category-text">
                                            <strong>{category.name}</strong>
                                            <small>{category.food_count} {category.food_count === 1 ? "item" : "items"}</small>
                                        </span>
                                    </button>

                                    <div className="dropdown menu-category-menu">
                                        <button
                                            type="button"
                                            className="row-menu-btn"
                                            data-bs-toggle="dropdown"
                                            disabled={busyId === `cat-${category.id}`}
                                            aria-label={`Options for ${category.name}`}
                                        >
                                            <EllipsisVertical size={16} />
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end">
                                            <li>
                                                <button className="dropdown-item" onClick={() => setCategoryForm({ category })}>
                                                    Edit
                                                </button>
                                            </li>
                                            <li>
                                                <button className="dropdown-item text-danger" onClick={() => handleDeleteCategory(category)}>
                                                    Delete
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* ---------- Foods ---------- */}
                <section className="panel menu-foods">
                    <div className="menu-foods-head">
                        <div>
                            <h2>
                                <Store size={22} className="panel-icon" />
                                {selectedCategory ? `Foods in ${selectedCategory.name}` : "All Foods"}
                            </h2>
                            {foodData && (
                                <small>{foodData.total} {foodData.total === 1 ? "item" : "items"}</small>
                            )}
                        </div>

                        <div className="menu-foods-tools">
                            <select
                                className="panel-select"
                                value={sortKey}
                                onChange={(e) => changeFilter(setSortKey, e.target.value)}
                                disabled={tab === "best"}
                                title={tab === "best" ? "Best sellers are sorted by most sold" : ""}
                                aria-label="Sort"
                            >
                                {Object.entries(SORTS).map(([key, s]) => (
                                    <option key={key} value={key}>{s.label}</option>
                                ))}
                            </select>

                            <div className="menu-view-toggle" role="group" aria-label="View">
                                <button
                                    type="button"
                                    className={view === "grid" ? "active" : ""}
                                    onClick={() => setView("grid")}
                                    aria-label="Grid view"
                                    aria-pressed={view === "grid"}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    type="button"
                                    className={view === "list" ? "active" : ""}
                                    onClick={() => setView("list")}
                                    aria-label="List view"
                                    aria-pressed={view === "list"}
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {!foodData && foods.loading && <Loading message="Loading foods..." />}
                    {foods.error && <ErrorMessage message={foods.error} onRetry={refresh} />}

                    {foodData && foodData.items.length === 0 && (
                        <p className="panel-empty">
                            {search
                                ? `No foods match "${search}".`
                                : categoryList.length === 0
                                    ? "Add a category first, then your food items."
                                    : "No food items here yet."}
                        </p>
                    )}

                    {foodData && foodData.items.length > 0 && (
                        <>
                            <div className={view === "grid" ? "menu-food-list grid" : "menu-food-list"}>
                                {foodData.items.map((food) => {
                                    const busy = busyId === `food-${food.id}`;

                                    return (
                                        <article
                                            key={food.id}
                                            className={editing?.id === food.id ? "menu-food editing" : "menu-food"}
                                        >
                                            <Thumb src={food.image} className="menu-food-img" />

                                            <div className="menu-food-info">
                                                <h3>{food.name}</h3>
                                                <Price food={food} />

                                                {(food.prep_time || food.calories !== null) && (
                                                    <p className="menu-food-meta">
                                                        {food.prep_time && <span><Clock size={14} /> {food.prep_time} mins</span>}
                                                        {food.calories !== null && (
                                                            <span><Flame size={14} className="flame" /> {food.calories} kcal</span>
                                                        )}
                                                    </p>
                                                )}

                                                {!categoryId && <span className="category-pill">{food.category.name}</span>}
                                            </div>

                                            <div className="menu-food-side">
                                                <button
                                                    type="button"
                                                    className={food.is_available ? "menu-status on" : "menu-status off"}
                                                    onClick={() => handleToggleFood(food)}
                                                    disabled={busy}
                                                    title="Click to switch"
                                                >
                                                    {food.is_available ? <CircleCheck size={15} /> : <CircleOff size={15} />}
                                                    {food.is_available ? "Available" : "Unavailable"}
                                                </button>

                                                <div className="menu-food-actions">
                                                    <button type="button" className="menu-edit-btn" onClick={() => startEdit(food)}>
                                                        <Pencil size={15} /> Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="menu-delete-btn"
                                                        onClick={() => handleDeleteFood(food)}
                                                        disabled={busy}
                                                        aria-label={`Delete ${food.name}`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            {foodData.total_pages > 1 && (
                                <div className="table-pages">
                                    <button
                                        type="button"
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span>Page {page} of {foodData.total_pages}</span>
                                    <button
                                        type="button"
                                        disabled={page >= foodData.total_pages}
                                        onClick={() => setPage(page + 1)}
                                        aria-label="Next page"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* ---------- Add / Edit form ---------- */}
                <aside className="panel menu-form-panel" ref={formPanel}>
                    <div className="panel-head menu-form-head">
                        <h2>
                            <UtensilsCrossed size={22} className="panel-icon" />
                            {editing ? "Edit Food Item" : "Add Food Item"}
                        </h2>
                    </div>

                    <FoodForm
                        key={editing ? `edit-${editing.id}` : `new-${formKey}`}
                        food={editing}
                        categories={categoryList}
                        defaultCategoryId={categoryId}
                        onCancel={handleFormCancel}
                        onSaved={handleFormSaved}
                    />
                </aside>
            </div>

            {categoryForm && (
                <CategoryForm
                    category={categoryForm.category}
                    onClose={() => setCategoryForm(null)}
                    onSaved={() => {
                        setNotice(categoryForm.category ? "Category saved." : "Category added.");
                        setCategoryForm(null);
                        refresh();
                    }}
                />
            )}

            {notice && (
                <div className="dash-notice" role="status" onClick={() => setNotice("")}>
                    {notice}
                </div>
            )}
        </OwnerLayout>
    );
}

export default MenuManagement;
