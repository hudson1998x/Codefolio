import { FC, useState, useEffect } from "react";
import './style.scss'

interface PageResult {
    id: number;
    pageTitle: string;
}

interface PagePickerProps {
    onSelect: (page: PageResult) => void;
}

export const PageSearchPicker: FC<PagePickerProps> = ({ onSelect }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PageResult[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const filter = JSON.stringify({ pageTitle: query });
                const res = await fetch(`/api/page?filter=${filter}&size=5`);
                const json = await res.json();
                if (json.ok) setResults(json.results);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="cf-page-picker">
            <div className="cf-page-picker__input-wrapper">
                <input 
                    type="text" 
                    placeholder="Type to search pages..." 
                    value={query} 
                    onChange={e => setQuery(e.target.value)}
                    className="cf-page-picker__input"
                />
                {searching && <div className="cf-page-picker__spinner" />}
            </div>

            {results.length > 0 && (
                <ul className="cf-page-picker__results">
                    {results.map(page => (
                        <li key={page.id} className="cf-page-picker__item" onClick={() => {
                            onSelect(page);
                            setQuery("");
                            setResults([]);
                        }}>
                            <span className="cf-page-picker__title">{page.pageTitle}</span>
                            <span className="cf-page-picker__path">/page/{page.id}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};