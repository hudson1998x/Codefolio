import { CodefolioProps, registerComponent } from "@components/registry";
import React, { FC, useState, useEffect, useCallback } from "react";
import './style.scss';
import { fetchContent } from "../../utils/fetch-content";
import { getSafeUrl } from "../../utils/safe-url";

interface DocNode {
    id: number;
    pageTitle: string;
    parentPage: string | number; // "0" = root level
    [key: string]: any;
}

// Extracts the document ID from URLs of the form /documents/:id
const getCurrentDocId = (): number | null => {
    const match = window.location.pathname.match(/\/documents\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
};

// Walks up the parentPage chain from a given doc ID, collecting all ancestor IDs.
// Used to ensure the sidebar path to the active page is fully expanded on load.
const getAncestorIds = (docs: DocNode[], startId: number): Set<number> => {
    const ancestors = new Set<number>();
    let current = docs.find(d => d.id === startId);
    while (current && String(current.parentPage) !== "0") {
        const parent = docs.find(d => String(d.id) === String(current!.parentPage));
        if (!parent) break;
        ancestors.add(parent.id);
        current = parent;
    }
    return ancestors;
};

export const DocumentationPage: FC<CodefolioProps<{ title: string, pageDescription: string }>> = ({ children, data }) => {
    const [docs, setDocs] = useState<DocNode[]>([]);
    const [filter, setFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
    const [initialised, setInitialised] = useState(false);

    // Captured once on mount — never changes during the page lifecycle
    const [currentDocId] = useState<number | null>(() => getCurrentDocId());

    // Streams the NDJSON doc index line-by-line, parsing each entry as it arrives
    // rather than waiting for the full payload to land
    useEffect(() => {
        const loadStaticDocs = async () => {
            setIsLoading(true);
            const results: DocNode[] = [];

            try {
                const response = await fetchContent('/content/documents/index.ndjson');
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) return;

                // Keep a rolling buffer for lines that span chunk boundaries
                let partialChunk = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = partialChunk + decoder.decode(value, { stream: true });
                    const lines = chunk.split("\n");
                    // The last element may be an incomplete line — carry it forward
                    partialChunk = lines.pop() || "";

                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                results.push(JSON.parse(line));
                            } catch (e) {
                                console.warn("Failed to parse ndjson line", e);
                            }
                        }
                    }
                }
                setDocs(results);
            } catch (err) {
                console.error("Static docs failed to load", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadStaticDocs();
    }, []);

    // Runs once after docs are loaded. Sets up the initial collapsed state:
    // - All nodes with children are collapsed by default
    // - The first root node is expanded as a sensible starting point
    // - Any ancestor of the current page is expanded so the active item is always visible
    useEffect(() => {
        if (initialised || docs.length === 0) return;

        const rootNodes = docs.filter(d => String(d.parentPage) === "0");
        const allWithChildren = new Set(
            docs
                .filter(d => docs.some(c => String(c.parentPage) === String(d.id)))
                .map(d => d.id)
        );

        const initialCollapsed = new Set(allWithChildren);

        // Always show the first root section open on initial load
        if (rootNodes[0]) initialCollapsed.delete(rootNodes[0].id);

        // Ensure the full path to the current page is expanded
        if (currentDocId !== null) {
            const ancestors = getAncestorIds(docs, currentDocId);
            ancestors.forEach(id => initialCollapsed.delete(id));

            // Also expand the current node if it has children
            initialCollapsed.delete(currentDocId);
        }

        setCollapsed(initialCollapsed);
        setInitialised(true);
    }, [docs, initialised, currentDocId]);

    const toggleCollapsed = useCallback((id: number) => {
        setCollapsed(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const hasChildren = useCallback((id: number) =>
        docs.some(d => String(d.parentPage) === String(id)),
    [docs]);

    // Returns the set of doc IDs that should be visible when a filter is active.
    // Includes both matched nodes and all their ancestors, so the tree path
    // to each result is always shown.
    const getVisibleIds = useCallback((search: string): Set<number> => {
        if (!search) return new Set();

        const matched = new Set<number>(
            docs
                .filter(doc =>
                    doc.pageTitle?.toLowerCase().includes(search) ||
                    doc.keywords?.toLowerCase().includes(search)
                )
                .map(doc => doc.id)
        );

        const visible = new Set(matched);

        const addAncestors = (parentPage: string | number) => {
            if (String(parentPage) === "0") return;
            const parent = docs.find(d => String(d.id) === String(parentPage));
            if (!parent) return;
            visible.add(parent.id);
            addAncestors(parent.parentPage);
        };

        matched.forEach(id => {
            const node = docs.find(d => d.id === id);
            if (node) addAncestors(node.parentPage);
        });

        return visible;
    }, [docs]);

    // Recursively renders the sidebar tree from a given parent ID.
    // When filtering, collapse state is ignored — all matched paths are shown fully expanded.
    const renderTree = (
        parentId: string | number = "0",
        level = 0,
        visibleIds?: Set<number>
    ) => {
        const isFiltering = !!filter;

        const childrenNodes = docs.filter(doc => {
            if (String(doc.parentPage) !== String(parentId)) return false;
            if (!isFiltering) return true;
            return visibleIds?.has(doc.id);
        });

        if (childrenNodes.length === 0) return null;

        return (
            <div className="tree-group">
                {childrenNodes.map(doc => {
                    const nodeHasChildren = hasChildren(doc.id);
                    // Filtering always overrides collapse — show the full matched path
                    const isCollapsed = !isFiltering && collapsed.has(doc.id);
                    const isActive = doc.id === currentDocId;

                    return (
                        <div key={doc.id} className="tree-item-container">
                            <div className={`nav-row level-${level}`}>
                                {nodeHasChildren ? (
                                    <button
                                        className={`collapse-btn ${isCollapsed ? "is-collapsed" : ""}`}
                                        onClick={() => toggleCollapsed(doc.id)}
                                        aria-label={isCollapsed ? "Expand" : "Collapse"}
                                    >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M9 18l6-6-6-6"/>
                                        </svg>
                                    </button>
                                ) : (
                                    <span className="collapse-btn-spacer" />
                                )}
                                <a
                                    href={getSafeUrl(`/documents/${doc.id}`)}
                                    className={`nav-link${isActive ? " is-active" : ""}`}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    {doc.pageTitle}
                                </a>
                            </div>

                            {!isCollapsed && renderTree(doc.id, level + 1, visibleIds)}
                        </div>
                    );
                })}
            </div>
        );
    };

    const visibleIds = getVisibleIds(filter.toLowerCase());

    // Direct children of the current page, shown as a directory at the bottom of the content area
    const childPages = currentDocId !== null
        ? docs.filter(d => String(d.parentPage) === String(currentDocId))
        : [];

    return (
        <div className={`doc-container ${isSidebarOpen ? 'sb-open' : 'sb-closed'}`}>
            <aside className="doc-sidebar">
                <div className="sb-header-area">
                    <div className="sb-brand">Documentation</div>
                    <div className="sb-search">
                        <input
                            type="text"
                            placeholder="Filter documentation..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                <nav className="sb-nav">
                    {isLoading ? (
                        <div className="sb-loading-state">Streaming docs...</div>
                    ) : (
                        renderTree("0", 0, visibleIds)
                    )}
                </nav>
            </aside>

            <main className="doc-main">
                <header className="doc-header">
                    <button className="btn-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12h18M3 6h18M3 18h18"/>
                        </svg>
                    </button>
                </header>

                <div className="doc-body">
                    <header className="body-intro">
                        <h1>{data.title || "Untitled Page"}</h1>
                        {data.pageDescription && <p className="description">{data.pageDescription}</p>}
                    </header>
                    <article className="prose">
                        {children}
                    </article>

                    {childPages.length > 0 && (
                        <nav className="doc-child-directory">
                            <h2 className="doc-child-directory__heading">In this section</h2>
                            <ul className="doc-child-directory__list">
                                {childPages.map(child => (
                                    <li key={child.id} className="doc-child-directory__item">
                                        <a href={getSafeUrl(`/documents/${child.id}`)} className="doc-child-directory__link">
                                            <span className="doc-child-directory__title">{child.pageTitle}</span>
                                            {child.pageDescription && (
                                                <span className="doc-child-directory__desc">{child.pageDescription}</span>
                                            )}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}
                </div>
            </main>
        </div>
    );
};

registerComponent({
    name: 'Core/DocumentationPage',
    component: DocumentationPage,
    defaults: {
        title: 'Untitled',
        pageDescription: 'No description'
    }
});