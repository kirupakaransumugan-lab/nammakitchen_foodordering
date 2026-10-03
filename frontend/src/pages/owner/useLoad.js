import { useEffect, useState } from "react";


// Calls load() every time "key" changes.
//   key: a text made from everything the request depends on, e.g. "2025-10-01|2025-10-31|3"
// While a new answer is coming, the old data stays on screen (no flashing),
// and an old, slow answer never replaces a newer one.
export function useLoad(load, key) {
    const [result, setResult] = useState({ key: null, data: null, error: "" });

    useEffect(() => {
        let ignore = false;

        load()
            .then((data) => {
                if (!ignore) setResult({ key: key, data: data, error: "" });
            })
            .catch((err) => {
                if (!ignore) setResult({ key: key, data: null, error: err.message });
            });

        return () => {
            ignore = true;
        };
        // "load" is a new function every render; "key" says when to really reload
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    return {
        data: result.data,
        error: result.key === key ? result.error : "",
        loading: result.key !== key
    };
}
