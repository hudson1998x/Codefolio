import { useState, useEffect, useRef, DependencyList } from 'react';

type ApiState<T> = {
    data: T | null;
    loading: boolean;
    error: Error | null;
};

export const useApi = function<T>(
    fn: () => Promise<T>,
    deps?: DependencyList
): [T | null, boolean, Error | null] {
    const [state, setState] = useState<ApiState<T>>({
        data: null,
        loading: true,
        error: null,
    });

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        // Cancel any in-flight request
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setState(prev => ({ ...prev, loading: true, error: null }));

        fn()
            .then(data => setState({ data, loading: false, error: null }))
            .catch(err => {
                if (err?.name === 'AbortError') return;
                setState({ data: null, loading: false, error: err });
            });

        return () => abortRef.current?.abort();
    }, deps);

    return [state.data, state.loading, state.error];
};