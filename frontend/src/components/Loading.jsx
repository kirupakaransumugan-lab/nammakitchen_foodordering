import "./PageState.css";


function Loading({ message = "Loading..." }) {
    return (
        <div className="page-state">
            <div className="spinner-border page-state-spinner" role="status"></div>
            <p>{message}</p>
        </div>
    );
}

export default Loading;
