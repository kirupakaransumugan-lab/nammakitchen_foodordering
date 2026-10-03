import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import "./Modal.css";


// A simple centred popup with a title and a close button.
// Closes with Esc, the X, or a click on the dark background.
function Modal({ title, onClose, children, width = 520 }) {
    useEffect(() => {
        function handleKey(event) {
            if (event.key === "Escape") onClose();
        }

        document.addEventListener("keydown", handleKey);
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = oldOverflow;
        };
    }, [onClose]);

    return createPortal(
        <div className="nk-modal-overlay" onClick={onClose}>
            <div
                className="nk-modal"
                style={{ maxWidth: width }}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="nk-modal-head">
                    <h2>{title}</h2>
                    <button type="button" className="nk-modal-close" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="nk-modal-body">{children}</div>
            </div>
        </div>,
        document.body
    );
}

export default Modal;
