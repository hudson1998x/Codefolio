import { CodefolioProps, registerComponent } from "@components/registry";
import { FC, useState, useEffect, useRef } from "react";
import './style.scss'

interface Document {
    id: number;
    title?: string;
    name?: string;
    [key: string]: any;
}

const DocumentationSelector: FC<CodefolioProps> = (props) => {
    const { data } = props;
    const { label, name, value: initialValue } = data;

    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<Document[]>([]);
    const [selectedValue, setSelectedValue] = useState<number | string>(initialValue || "");
    const [selectedLabel, setSelectedLabel] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch documents based on search term
    useEffect(() => {
        const fetchDocs = async () => {
            if (!searchTerm.trim() && !isOpen) return;

            // Using your backend's partial match logic: ?filter={"title":"search"}
            const filter = JSON.stringify({ title: searchTerm });
            try {
                const response = await fetch(`/api/documents?filter=${encodeURIComponent(filter)}&size=10`);
                const json = await response.json();
                if (json.ok) setResults(json.results);
            } catch (err) {
                console.error("Failed to fetch documents", err);
            }
        };

        const timeoutId = setTimeout(fetchDocs, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, isOpen]);

    const handleSelect = (doc: Document) => {
        const displayLabel = doc.title || doc.name || `ID: ${doc.id}`;
        setSelectedValue(doc.id);
        setSelectedLabel(displayLabel);
        setSearchTerm(displayLabel);
        setIsOpen(false);
    };

    return (
        <div className="documentation-selector-container" ref={wrapperRef}>
            <label className="selector-label">{label}</label>
            
            <div className={`selector-wrapper ${isOpen ? 'is-open' : ''}`}>
                <input
                    type="text"
                    className="selector-input"
                    placeholder="Search documentation..."
                    value={searchTerm}
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                {isOpen && (
                    <ul className="results-dropdown">
                        {results.length > 0 ? (
                            results.map((doc) => (
                                <li key={doc.id} onClick={() => handleSelect(doc)}>
                                    {doc.title || doc.name || `Document #${doc.id}`}
                                </li>
                            ))
                        ) : (
                            <li className="no-results">No documents found</li>
                        )}
                    </ul>
                )}
            </div>

            {/* The hidden input holding the ID for form submission */}
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