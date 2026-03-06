import { CodefolioProps, registerComponent } from "@components/registry";
import { FC, useState, useEffect, useRef } from "react";
import { fetchContent } from "app/web/thirdparty/utils/fetch-content";
import './style.scss'

interface Document {
    id: number;
    title?: string;
    name?: string;
    pageTitle?: string;
    [key: string]: any;
}

const DocumentationSelector: FC<CodefolioProps> = (props) => {
    const { data } = props;
    const { label, name, value: initialValue } = data;

    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<Document[]>([]);
    const [selectedValue, setSelectedValue] = useState<number | string>(initialValue || "");
    const [selectedParent, setSelectedParent] = useState<Document | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // 1. HYDRATION
    useEffect(() => {
        const loadSelected = async () => {
            if (!selectedValue) return;
            setIsLoading(true);
            try {
                const response = await fetchContent(`/content/documents/${selectedValue}.json`);
                const data = await response.json();
                const doc = data?.data || data;
                if (doc) {
                    setSelectedParent(doc);
                    setSearchTerm(doc.pageTitle || doc.title || "");
                }
            } catch (err) {
                console.error("Hydration failed", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadSelected();
    }, [selectedValue]);

    // 2. SEARCH
    useEffect(() => {
        const fetchDocs = async () => {
            if (!isOpen || !searchTerm) return;
            setIsLoading(true);
            const filter = JSON.stringify({ pageTitle: searchTerm });
            try {
                const response = await fetch(`/api/documents?filter=${encodeURIComponent(filter)}&size=10`);
                const json = await response.json();
                if (json.ok) setResults(json.results);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchDocs, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (doc: Document) => {
        setSelectedValue(doc.id);
        setSelectedParent(doc);
        setSearchTerm(doc.pageTitle || doc.title || "");
        setIsOpen(false);
    };

    const clearSelection = () => {
        setSelectedValue("");
        setSelectedParent(null);
        setSearchTerm("");
    };

    return (
        <div className="documentation-selector-container" ref={wrapperRef}>
            <div className="selector-header">
                <label className="selector-label">{label}</label>
                {selectedParent && (
                    <span className="selected-badge">
                        ID: {selectedValue}
                    </span>
                )}
            </div>
            
            <div className={`selector-wrapper ${isOpen ? 'is-open' : ''} ${isLoading ? 'is-loading' : ''}`}>
                <div className="input-group">
                    <input
                        type="text"
                        className="selector-input"
                        placeholder="Search documentation..."
                        value={searchTerm}
                        onFocus={() => setIsOpen(true)}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button type="button" className="clear-btn" onClick={clearSelection}>
                            &times;
                        </button>
                    )}
                </div>
                
                {isOpen && (
                    <ul className="results-dropdown">
                        {results.length > 0 ? (
                            results.map((doc) => (
                                <li 
                                    key={doc.id} 
                                    onClick={() => handleSelect(doc)}
                                    className={selectedValue === doc.id ? 'is-selected' : ''}
                                >
                                    <span className="doc-id">#{doc.id}</span>
                                    <span className="doc-text">{doc.pageTitle || doc.title}</span>
                                </li>
                            ))
                        ) : (
                            <li className="no-results">
                                {isLoading ? 'Searching...' : 'No documents found'}
                            </li>
                        )}
                    </ul>
                )}
            </div>

            <input type="hidden" name={name} value={selectedValue} />
        </div>
    );
};

registerComponent({
    name: 'DocumentationSelector',
    component: DocumentationSelector,
    defaults: {
        label: "Select Document",
        name: "document_id"
    }
});