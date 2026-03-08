import { FC, useState, useEffect } from "react";
import './style.scss'
import { CodefolioProps, registerComponent } from "@components/registry";
import { getSafeUrl } from 'app/web/thirdparty/utils/safe-url';

// ---------------------------------------------------------------------------
// NDJSON sources
// ---------------------------------------------------------------------------

interface NdjsonSource {
    path: string;
    searchFields: string[];
    viewBase: string;
}

const sources: Map<string, NdjsonSource> = new Map();

export const addPickerSource = (path: string, searchFields: string[], viewBase: string) => {
    const key = path.split('/').filter(Boolean).at(-2) ?? path;
    sources.set(key, { path, searchFields, viewBase });
};

addPickerSource(getSafeUrl('/content/page/index.ndjson'),      ['pageTitle', 'pageDescription'],             '/page/');
addPickerSource(getSafeUrl('/content/blog/index.ndjson'),      ['pageTitle', 'category', 'keywords'],        '/blog/');
addPickerSource(getSafeUrl('/content/documents/index.ndjson'), ['pageTitle', 'pageDescription', 'keywords'], '/documents/');

// ---------------------------------------------------------------------------
// Static (non-entity) pages — extend this array to add more
// ---------------------------------------------------------------------------

export interface StaticPage {
    label: string;
    href: string;
    sourceKey: string;
}

export const staticPages: StaticPage[] = [
    { label: 'Projects',  href: getSafeUrl('/projects'),  sourceKey: 'static' },
    { label: 'Blog',      href: getSafeUrl('/blog'),      sourceKey: 'static' },
    { label: 'Documents', href: getSafeUrl('/documents'), sourceKey: 'static' },
];

export const addStaticPage = (label: string, href: string, sourceKey = 'static') => {
    staticPages.push({ label, href: getSafeUrl(href), sourceKey });
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageResult {
    id: number | string;
    pageTitle: string;
    sourceKey: string;
    href: string;
}

interface PagePickerProps {
    onSelect: (page: PageResult) => void;
}

// ---------------------------------------------------------------------------
// Resolve a saved href like "/documents/1" or "/page/3" back to a PageResult.
// The href encodes both the type and the id — fetch /content/{type}/{id}.json directly.
// ---------------------------------------------------------------------------

const resolveValue = async (value: string): Promise<PageResult | null> => {
    if (!value || value === '0' || value === '') return null;

    // Strip leading slash, split into [type, id]
    // "/documents/1" -> ["documents", "1"]
    // "/page/3"      -> ["page", "3"]
    // "/blog/5"      -> ["blog", "5"]
    const parts = value.replace(/^\//, '').split('/');
    if (parts.length < 2) return null;

    const [type, id] = parts;

    try {
        const res = await fetch(getSafeUrl(`/content/${type}/${id}.json`));
        if (!res.ok) return null;
        const record = await res.json();

        const sourceKey = Array.from(sources.entries())
            .find(([, s]) => s.viewBase === `/${type}/`)?.[0] ?? type;

        return {
            id,
            pageTitle: record.pageTitle || record.projectTitle || id,
            sourceKey,
            href: getSafeUrl(`/${type}/${id}`),
        };
    } catch {
        return null;
    }
};

// ---------------------------------------------------------------------------
// NDJSON streaming search
// ---------------------------------------------------------------------------

const streamNdjson = async (
    key: string,
    source: NdjsonSource,
    queryLower: string,
    limit = 5
): Promise<PageResult[]> => {
    const results: PageResult[] = [];
    try {
        const res = await fetch(source.path);
        if (!res.ok || !res.body) return [];
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        outer: while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                try {
                    const record = JSON.parse(trimmed);
                    const matches = source.searchFields.some(field => {
                        const val = record[field];
                        return val && String(val).toLowerCase().includes(queryLower);
                    });
                    if (matches) {
                        const id = record.id ?? record.slug;
                        results.push({
                            id,
                            pageTitle: record.pageTitle || String(id),
                            sourceKey: key,
                            href: getSafeUrl(`${source.viewBase}${id}`),
                        });
                        if (results.length >= limit) { reader.cancel(); break outer; }
                    }
                } catch { /* skip */ }
            }
        }
    } catch (e) {
        console.error(`NDJSON stream failed [${key}]:`, e);
    }
    return results;
};

const getTag = (sourceKey: string) =>
    sourceKey.charAt(0).toUpperCase() + sourceKey.slice(1);

// ---------------------------------------------------------------------------
// PageSearchPicker
// ---------------------------------------------------------------------------

export const PageSearchPicker: FC<PagePickerProps> = ({ onSelect }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PageResult[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (query.length < 2) { setResults([]); return; }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const q = query.toLowerCase();
                const [sourceMatches, staticMatches] = await Promise.all([
                    Promise.all(
                        Array.from(sources.entries()).map(([key, source]) => streamNdjson(key, source, q))
                    ),
                    Promise.resolve(
                        staticPages
                            .filter(p => p.label.toLowerCase().includes(q))
                            .map(p => ({ id: p.href, pageTitle: p.label, sourceKey: p.sourceKey, href: p.href }))
                    ),
                ]);
                setResults([...staticMatches, ...sourceMatches.flat()]);
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
                    {results.map((page, i) => (
                        <li
                            key={`${page.sourceKey}-${i}`}
                            className="cf-page-picker__item"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => { onSelect(page); setQuery(""); setResults([]); }}
                        >
                            <span className="cf-page-picker__title">{page.pageTitle}</span>
                            <span className={`cf-page-picker__tag cf-page-picker__tag--${page.sourceKey}`}>
                                {getTag(page.sourceKey)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// PageSearchPickerInput
// Saves:  page.href  e.g. "/documents/1"  (type + id encoded in the value)
// Loads:  splits href -> fetches /content/{type}/{id}.json -> populates pill
// ---------------------------------------------------------------------------

interface PickerInputData {
    name: string;
    value: string;
    label: string;
}

const PageSearchPickerInput: FC<CodefolioProps<PickerInputData>> = ({ data }) => {
    const { value, name, label } = data;

    const [currentValue, setValue] = useState<string>(value ?? '');
    const [selected, setSelected] = useState<PageResult | null>(null);
    const [resolving, setResolving] = useState(false);

    useEffect(() => {
        if (!value || value === '' || value === '0') return;
        setResolving(true);
        resolveValue(value).then(result => {
            if (result) {
                setSelected(result);
                setValue(result.href);
            }
            setResolving(false);
        });
    }, [value]);

    return (
        <div className="cf-page-picker-input">
            <label className="cf-label">{label ?? 'Select page'}</label>
            <input type="hidden" name={name} value={currentValue} />

            {resolving && (
                <div className="cf-page-picker-input__selected">
                    <div className="cf-page-picker__spinner" />
                    <span className="cf-page-picker-input__selected-label">Loading…</span>
                </div>
            )}

            {!resolving && selected && (
                <div className="cf-page-picker-input__selected">
                    <span className={`cf-page-picker__tag cf-page-picker__tag--${selected.sourceKey}`}>
                        {getTag(selected.sourceKey)}
                    </span>
                    <span className="cf-page-picker-input__selected-label">{selected.pageTitle}</span>
                    <button
                        type="button"
                        className="cf-page-picker-input__clear"
                        onClick={() => { setValue(''); setSelected(null); }}
                    >
                        &times;
                    </button>
                </div>
            )}

            {!resolving && !selected && (
                <PageSearchPicker
                    onSelect={(page) => {
                        setValue(page.href); // "/documents/1", "/page/3", "/blog/5" etc.
                        setSelected(page);
                    }}
                />
            )}
        </div>
    );
};

registerComponent({
    name: 'PageSelector',
    component: PageSearchPickerInput,
    defaults: {
        name: 'page',
        value: '',
        label: 'Select page',
    },
});