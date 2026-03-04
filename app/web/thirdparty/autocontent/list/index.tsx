import React, { FC, useState, useEffect, useCallback } from "react"
import { registerComponent, CodefolioProps } from "@components/registry"
import './style.scss'
import { Link } from "@router";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SearchField {
    /** The key on the entity to match against. */
    key: string;
    /** Label shown above the input. */
    label: string;
    /** Input type. Default: "text". */
    type?: "text" | "number" | "select";
    /** Options for type="select". */
    options?: { label: string; value: string }[];
}

export interface AutoListData {
    /**
     * The content API base URL used for search/CRUD calls.
     * e.g. "/content/posts"  →  GET /content/posts?page=1&filter=...
     */
    apiUrl: string;
    /**
     * The admin UI base URL used for navigation links.
     * e.g. "/en-admin/posts"  →  add: /en-admin/posts/add, edit: /en-admin/posts/:id
     */
    listUrl: string;
    /** Fields to render as search/filter inputs. */
    searchFields: SearchField[];
    /** Column keys + labels to show in the results table. */
    columns: { key: string; label: string }[];
}

/** Internal state map of field key → current filter value. */
interface SearchState {
    [key: string]: string;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * A fully data-driven admin list view that renders a search/filter bar,
 * a paginated results table, and add/edit navigation links — all derived
 * from the supplied {@link AutoListData} configuration.
 *
 * - Search and filter inputs are generated from `searchFields`.
 * - Table columns are generated from `columns`.
 * - API calls are made to `apiUrl`; UI links point to `listUrl`.
 *
 * Registered in the component registry as `"AutoList"`.
 *
 * @param props - Standard {@link CodefolioProps} wrapping {@link AutoListData}.
 */
export const AutoContentList: FC<CodefolioProps<AutoListData>> = ({ data }) => {
    const { apiUrl, listUrl, searchFields = [], columns = [] } = data;

    // UI navigation links — derived from the admin listUrl, not the API.
    const addUrl  = listUrl + "/add";
    const editUrl = listUrl + "/:id";

    const [filters, setFilters] = useState<SearchState>(() =>
        Object.fromEntries(searchFields.map((f) => [f.key, ""]))
    );
    const [results, setResults] = useState<Record<string, any>[]>([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);
    const [page,    setPage]    = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const PAGE_SIZE = 20;

    /**
     * Constructs the paginated API fetch URL for a given page number,
     * appending any active (non-empty) filters as a JSON-encoded `filter` param.
     *
     * @param p - The 1-based page number to fetch.
     * @returns The fully constructed URL string.
     */
    const buildApiUrl = useCallback((p: number) => {
        const params = new URLSearchParams();
        params.set("page", String(p));
        params.set("size", String(PAGE_SIZE));

        const activeFilters = Object.fromEntries(
            Object.entries(filters).filter(([, v]) => v !== "")
        );
        if (Object.keys(activeFilters).length > 0) {
            params.set("filter", JSON.stringify(activeFilters));
        }

        return `${apiUrl}?${params.toString()}`;
    }, [apiUrl, filters]);

    /**
     * Fetches a page of results from the API and updates component state.
     * Sets `hasMore` to `false` when the returned item count is below {@link PAGE_SIZE}.
     *
     * @param p - The 1-based page number to fetch.
     */
    const fetchResults = useCallback(async (p: number) => {
        setLoading(true);
        setError(null);
        try {
            const res  = await fetch(buildApiUrl(p));
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Request failed");

            const items: Record<string, any>[] = json.results ?? [];
            setResults(items);
            setHasMore(items.length === PAGE_SIZE);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [buildApiUrl]);

    useEffect(() => { fetchResults(page); }, [page]); // eslint-disable-line

    /**
     * Handles search form submission by resetting to page 1 and
     * triggering a fresh fetch with the current filter state.
     *
     * @param e - The React form submission event.
     */
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchResults(1);
    };

    /**
     * Updates a single filter value in state by key.
     *
     * @param key   - The {@link SearchField} key to update.
     * @param value - The new filter value.
     */
    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    /**
     * Resolves the edit URL for a specific entity by substituting
     * the `:id` placeholder with the given ID.
     *
     * @param id - The entity's numeric or string ID.
     * @returns The fully resolved edit URL string.
     */
    const resolveEditUrl = (id: string | number) =>
        editUrl.replace(":id", String(id));

    /**
     * Converts a camelCase or PascalCase string into a space-separated
     * human-readable label. e.g. `"createdAt"` → `"Created At"`.
     *
     * @param arg - The raw camelCase/PascalCase string to convert.
     * @returns The formatted string, or the original value if empty.
     */
    function toPascalCase(arg: string) {
        if (!arg) return arg;
        const capitalized = arg[0].toUpperCase() + arg.substring(1);
        return capitalized.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="cf-auto-list">

            {/* Search bar */}
            {searchFields.length > 0 && (
                <form className="cf-auto-list__search" onSubmit={handleSearch}>
                    {searchFields.map((field) => (
                        <div key={field.key} className="cf-auto-list__search-field">
                            <label className="cf-auto-list__label" htmlFor={`cf-filter-${field.key}`}>
                                {field.label}
                            </label>

                            {field.type === "select" ? (
                                <select
                                    id={`cf-filter-${field.key}`}
                                    className="cf-auto-list__select"
                                    value={filters[field.key] ?? ""}
                                    onChange={(e) => handleFilterChange(field.key, e.target.value)}
                                >
                                    <option value="">All</option>
                                    {(field.options ?? []).map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    id={`cf-filter-${field.key}`}
                                    className="cf-auto-list__input"
                                    type={field.type ?? "text"}
                                    value={filters[field.key] ?? ""}
                                    onChange={(e) => handleFilterChange(field.key, e.target.value)}
                                    placeholder={`Filter by ${toPascalCase(field.label)}…`}
                                />
                            )}
                        </div>
                    ))}

                    <div className="cf-auto-list__search-actions">
                        <button type="submit" className="cf-auto-list__btn cf-auto-list__btn--primary">
                            Search
                        </button>
                        <button
                            type="button"
                            className="cf-auto-list__btn"
                            onClick={() => {
                                const cleared = Object.fromEntries(searchFields.map((f) => [f.key, ""]));
                                setFilters(cleared);
                                setPage(1);
                                setTimeout(() => fetchResults(1), 0);
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </form>
            )}

            {/* Toolbar */}
            <div className="cf-auto-list__toolbar">
                <a href={addUrl} className="cf-auto-list__btn cf-auto-list__btn--primary">
                    + Add new
                </a>
            </div>

            {/* Results */}
            {error && (
                <div className="cf-auto-list__error">{error}</div>
            )}

            {loading ? (
                <div className="cf-auto-list__loading">Loading…</div>
            ) : (
                <table className="cf-auto-list__table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key} className="cf-auto-list__th">{toPascalCase(col.label)}</th>
                            ))}
                            <th className="cf-auto-list__th cf-auto-list__th--actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.length === 0 ? (
                            <tr>
                                <td className="cf-auto-list__empty" colSpan={columns.length + 1}>
                                    No results found.
                                </td>
                            </tr>
                        ) : results.map((row) => (
                            <tr key={row.id} className="cf-auto-list__row">
                                {columns.map((col) => (
                                    <td key={col.key} className="cf-auto-list__td">
                                        {String(row[col.key] ?? "")}
                                    </td>
                                ))}
                                <td className="cf-auto-list__td cf-auto-list__td--actions">
                                    <Link
                                        to={resolveEditUrl(row.id)}
                                        className="cf-auto-list__btn cf-auto-list__btn--small"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Pagination */}
            <div className="cf-auto-list__pagination">
                <button
                    className="cf-auto-list__btn"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                    ← Prev
                </button>
                <span className="cf-auto-list__page-indicator">Page {page}</span>
                <button
                    className="cf-auto-list__btn"
                    disabled={!hasMore}
                    onClick={() => setPage((p) => p + 1)}
                >
                    Next →
                </button>
            </div>
        </div>
    );
};

// ── Registry ─────────────────────────────────────────────────────────────────

registerComponent({
    name: "AutoList",
    defaults: {
        apiUrl:       "",
        listUrl:      "",
        searchFields: [],
        columns:      [],
    } satisfies AutoListData,
    component: AutoContentList,
});