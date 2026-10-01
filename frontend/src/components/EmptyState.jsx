import "./PageState.css";


function EmptyState({ icon = "bi-inbox", message }) {
    return (
        <div className="page-state">
            <i className={`bi ${icon} page-state-icon`}></i>
            <p>{message}</p>
        </div>
    );
}

export default EmptyState;
