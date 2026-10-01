import "./Cards.css";


// One category box. "isActive" gives it the orange border.
function CategoryCard({ category, isActive, onClick }) {
    return (
        <button
            type="button"
            className={isActive ? "category-card active" : "category-card"}
            onClick={() => onClick(category)}
        >
            <div className="category-card-img">
                {category.image ? (
                    <img src={category.image} alt={category.name} />
                ) : (
                    <span className="img-placeholder">
                        <i className="bi bi-image"></i>
                    </span>
                )}
            </div>

            <span className="category-card-name">{category.name}</span>
        </button>
    );
}

export default CategoryCard;
