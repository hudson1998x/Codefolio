import { CodefolioProps, registerComponent } from "@components/registry";
import React, { FC, useState, useEffect } from "react";
import './style.scss';
import { fetchContent } from "../../utils/fetch-content";
import { getSafeUrl } from "../../utils/safe-url";


interface DocNode {
    id: number;
    pageTitle: string;
    parentPage: string | number; // String '0' in your ndjson
    [key: string]: any;
}

export const DocumentationPage: FC<CodefolioProps> = ({ children, data }) => {
    const [docs, setDocs] = useState<DocNode[]>([]);
    const [filter, setFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(true);

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
                    
                    // Keep the last partial line
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

    // client-side filtering since we are in a static context
    const filteredTree = docs.filter(doc => {
        if (!filter) return true;
        const search = filter.toLowerCase();
        return (
            doc.pageTitle?.toLowerCase().includes(search) ||
            doc.keywords?.toLowerCase().includes(search)
        );
    });

    const renderTree = (parentId: string | number = "0", level = 0) => {
        const childrenNodes = filteredTree.filter(doc => String(doc.parentPage) === String(parentId));
        
        if (childrenNodes.length === 0) return null;

        return (
            <div className="tree-group">
                {childrenNodes.map(doc => (
                    <div key={doc.id} className="tree-item-container">
                        <a href={getSafeUrl(`/documents/${doc.id}`)} className={`nav-link level-${level}`}>
                            {doc.pageTitle}
                        </a>
                        {renderTree(doc.id, level + 1)}
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
                        renderTree("0")
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