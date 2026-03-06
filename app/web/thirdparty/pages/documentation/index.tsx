import { CodefolioProps, registerComponent } from "@components/registry";
import React, { FC, useState, useEffect, useMemo } from "react";
import './style.scss';

interface DocNode {
    id: number;
    pageTitle: string;
    parentId?: number;
    [key: string]: any; // Allow for other queryable fields
}

export const DocumentationPage: FC<CodefolioProps> = ({ children, data }) => {
    const [docs, setDocs] = useState<DocNode[]>([]);
    const [filter, setFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const fetchDocs = async () => {
            setIsLoading(true);
            try {
                // Since your backend supports partial matches on any field:
                // We'll target 'pageTitle', but you could add more keys to this object
                const queryFilter = filter ? JSON.stringify({ pageTitle: filter }) : "{}";
                
                const response = await fetch(
                    `/api/documents?size=200&filter=${encodeURIComponent(queryFilter)}`
                );
                const json = await response.json();
                
                if (json.ok) {
                    setDocs(json.results);
                }
            } catch (err) {
                console.error("Docs failed to load", err);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchDocs();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [filter]); // This correctly triggers the re-fetch

    const renderTree = (parentId: number | null = null, level = 0) => {
        const childrenNodes = docs.filter(doc => (doc.parentId || null) === parentId);
        
        // If we are filtering and have no direct children, we might still want to 
        // show orphans if the API returned them as a flat list during search.
        const nodesToRender = (filter && parentId === null && childrenNodes.length === 0) 
            ? docs 
            : childrenNodes;

        if (nodesToRender.length === 0) return null;

        return (
            <div className="tree-group">
                {nodesToRender.map(doc => (
                    <div key={doc.id} className="tree-item-container">
                        <a href={`/documents/${doc.id}`} className={`nav-link level-${level}`}>
                            {doc.pageTitle}
                        </a>
                        {/* Only recurse if we aren't in a flat search result view */}
                        {!filter && renderTree(doc.id, level + 1)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={`doc-container ${isSidebarOpen ? 'sb-open' : 'sb-closed'}`}>
            <aside className="doc-sidebar">
                <div className="sb-header-area">
                    <div className="sb-brand">Documentation</div>
                    <div className="sb-search">
                        <input 
                            type="text" 
                            placeholder="Search documentation..." 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>
                
                <nav className="sb-nav">
                    {isLoading ? (
                        <div className="sb-loading-state">Updating...</div>
                    ) : (
                        renderTree(null)
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
                    <div className="header-tags">
                        {data?.tags ? data.tags.split(',').map((tag: string) => (
                            <span key={tag} className="tag-badge">{tag.trim()}</span>
                        )) : <span className="tag-badge">v1.0.0</span>}
                    </div>
                </header>
                
                <div className="doc-body">
                    <header className="body-intro">
                        <h1>{data.title || "Documentation"}</h1>
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