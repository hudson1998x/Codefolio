import React, { FC, useState, useEffect, useCallback } from "react";
import { registerComponent, CodefolioProps } from "@components/registry";
import './style.scss';

export interface SearchField {
    key: string;
    label: string;
    type?: "text" | "number" | "select";
    options?: { label: string; value: string }[];
}

export interface AutoListData {
    apiUrl: string;
    listUrl: string;
    searchFields: SearchField[];
    columns: { key: string; label: string }[];
}

interface SearchState { [key: string]: string; }

export const AutoContentList: FC<CodefolioProps<AutoListData>> = ({ data }) => {
    const { apiUrl, listUrl, searchFields = [], columns = [] } = data;

    const addUrl = listUrl + "/add";
    const editUrl = listUrl + "/:id";

    const [filters, setFilters] = useState<SearchState>(() =>
        Object.fromEntries(searchFields.map((f) => [f.key, ""]))
    );
    const [results, setResults] = useState<Record<string, any>[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selected, setSelected] = useState<Set<string | number>>(new Set());
    const [deleting, setDeleting] = useState(false);

    const PAGE_SIZE = 20;

    const buildApiUrl = useCallback((p: number) => {
        const params = new URLSearchParams();
        params.set("page", String(p));
        params.set("size", String(PAGE_SIZE));
        const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
        if (Object.keys(activeFilters).length > 0) params.set("filter", JSON.stringify(activeFilters));
        return `${apiUrl}?${params.toString()}`;
    }, [apiUrl, filters]);

    const fetchResults = useCallback(async (p: number) => {
        setLoading(true);
        setError(null);
        setSelected(new Set());
        try {
            const res = await fetch(buildApiUrl(p));
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Request failed");
            const items: Record<string, any>[] = json.results ?? [];
            setResults(items);
            setHasMore(items.length === PAGE_SIZE);
        } catch (e: any) {
            setError(e.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [buildApiUrl]);

    useEffect(() => { fetchResults(page); }, [page, fetchResults]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchResults(1);
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const toggleSelect = (id: string | number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        const allIds = results.map((r) => r.id);
        const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
        setSelected(allSelected ? new Set() : new Set(allIds));
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`Permanently delete ${selected.size} items?`)) return;
        setDeleting(true);
        try {
            await Promise.all([...selected].map((id) => fetch(`${apiUrl}/${id}`, { method: "DELETE" })));
            fetchResults(page);
        } finally {
            setDeleting(false);
        }
    };

    const allSelected = results.length > 0 && results.every((r) => selected.has(r.id));

    return (
        <div className="cf-auto-list">
            <div className="cf-auto-list__inner">
                
                <header className="cf-auto-list__header">
                    <div className="cf-auto-list__title-group">
                        <h1>{apiUrl.split('/').pop()?.toUpperCase() || "Entries"}</h1>
                        <p>{results.length} records found</p>
                    </div>
                    <div className="cf-auto-list__header-actions">
                        {selected.size > 0 && (
                            <button onClick={handleDeleteSelected} disabled={deleting} className="cf-auto-list__btn cf-auto-list__btn--danger">
                                {deleting ? "..." : `Delete ${selected.size}`}
                            </button>
                        )}
                        <a href={addUrl} className="cf-auto-list__btn cf-auto-list__btn--primary">
                            + New Entry
                        </a>
                    </div>
                </header>

                {searchFields.length > 0 && (
                    <form className="cf-auto-list__filters" onSubmit={handleSearch}>
                        <div className="cf-auto-list__filter-grid">
                            {searchFields.map((field) => (
                                <div key={field.key} className="cf-auto-list__control">
                                    <label>{field.label}</label>
                                    {field.type === "select" ? (
                                        <select value={filters[field.key]} onChange={(e) => handleFilterChange(field.key, e.target.value)}>
                                            <option value="">All</option>
                                            {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    ) : (
                                        <input 
                                            type={field.type || "text"} 
                                            value={filters[field.key]} 
                                            placeholder={`Search ${field.label}...`}
                                            onChange={(e) => handleFilterChange(field.key, e.target.value)} 
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="cf-auto-list__filter-btns">
                            <button type="submit" className="cf-auto-list__btn">Apply</button>
                            <button type="button" className="cf-auto-list__btn-link" onClick={() => {
                                setFilters(Object.fromEntries(searchFields.map(f => [f.key, ""])));
                                setPage(1);
                                setTimeout(() => fetchResults(1), 0);
                            }}>Reset</button>
                        </div>
                    </form>
                )}

                <div className="cf-auto-list__body">
                    {error && <div className="cf-auto-list__error">{error}</div>}
                    <div className="cf-auto-list__table-wrapper">
                        <table className="cf-auto-list__table">
                            <thead>
                                <tr>
                                    <th className="w-checkbox">
                                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                                    </th>
                                    {columns.map((col) => (
                                        <th key={col.key}>{col.label}</th>
                                    ))}
                                    <th className="w-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={columns.length + 2} className="cf-auto-list__loading">Loading records...</td></tr>
                                ) : results.length === 0 ? (
                                    <tr><td colSpan={columns.length + 2} className="cf-auto-list__empty">No data found.</td></tr>
                                ) : results.map((row) => (
                                    <tr key={row.id} className={selected.has(row.id) ? 'is-selected' : ''}>
                                        <td><input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} /></td>
                                        {columns.map((col) => (
                                            <td key={col.key}>{String(row[col.key] ?? "-")}</td>
                                        ))}
                                        <td>
                                            <a href={editUrl.replace(":id", row.id)} className="cf-auto-list__edit-link">Edit</a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <footer className="cf-auto-list__footer">
                    <div className="cf-auto-list__pagination">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                        <span className="cf-auto-list__page-indicator">Page {page}</span>
                        <button disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

registerComponent({
    name: "AutoList",
    defaults: { apiUrl: "", listUrl: "", searchFields: [], columns: [] },
    component: AutoContentList,
});