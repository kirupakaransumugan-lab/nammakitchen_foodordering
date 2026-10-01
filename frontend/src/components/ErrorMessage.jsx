import "./PageState.css";


// Shows an error. If onRetry is given, it also shows a "Try again" button.
function ErrorMessage({ message, onRetry }) {
    return (
        <div className="page-state page-state-error">
            <i className="bi bi-exclamation-circle page-state-icon"></i>
            <p>{message}</p>

            {onRetry && (
                <button className="page-state-retry" onClick={onRetry}>
                    Try again
                </button>
            )}
        </div>
    );
}

export default ErrorMessage;
