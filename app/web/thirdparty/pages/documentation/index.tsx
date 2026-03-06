import { CodefolioProps, registerComponent } from "@components/registry";
import React, { FC, useState, useEffect, useCallback } from "react";
import './style.scss';
import { fetchContent } from "../../utils/fetch-content";
import { getSafeUrl } from "../../utils/safe-url";

interface DocNode {
    id: number;
    pageTitle: string;
    parentPage: string | number;
    [key: string]: any;
}

export const DocumentationPage: FC<CodefolioProps> = ({ children, data }) => {
    const [docs, setDocs] = useState<DocNode[]>([]);
    const [filter, setFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
    const [initialised, setInitialised] = useState(false);

    useEffect(() => {
        const loadStaticDocs = async () => {
            setIsLoading(true);
            const results: DocNode[] = [];

            try {
                const response = await fetchContent('/content/documents/index.ndjson');
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) return;

                let partialChunk = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = partialChunk + decoder.decode(value, { stream: true });
                    const lines = chunk.split("\n");
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

    // Once docs load, collapse everything except the first root-level node
    useEffect(() => {
        if (initialised || docs.length === 0) return;

        const rootNodes = docs.filter(d => String(d.parentPage) === "0");
        const allWithChildren = new Set(
            docs
                .filter(d => docs.some(c => String(c.parentPage) === String(d.id)))
                .map(d => d.id)
        );

        // Collapse all nodes that have children, except the first root node
        const initialCollapsed = new Set(allWithChildren);
        if (rootNodes[0]) initialCollapsed.delete(rootNodes[0].id);

        setCollapsed(initialCollapsed);
        setInitialised(true);
    }, [docs, initialised]);

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

    // Build the full set of IDs that should be visible when filtering:
    // matched nodes + all their ancestors up to root
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
                    // When filtering, never hide children — expand everything in the matched path
                    const isCollapsed = !isFiltering && collapsed.has(doc.id);

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
                                <a href={getSafeUrl(`/documents/${doc.id}`)} className="nav-link">
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
                </div>
            </main>
        </div>
    );
};

registerComponent({
    name: 'Core/DocumentationPage',
    component: DocumentationPage,
    defaults: {}
});