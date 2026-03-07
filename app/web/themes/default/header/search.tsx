import React, { useState, useEffect, useRef } from 'react';
import { getSafeUrl } from 'app/web/thirdparty/utils/safe-url';

// ---------------------------------------------------------------------------
// Source registry
// ---------------------------------------------------------------------------

interface SearchResult {
  label: string;
  href: string;
  sourceKey: string;
  id?: number | string;
}

interface NdjsonSource {
  path: string;
  searchFields: string[];
  viewBase: string;
}

const sources: Map<string, NdjsonSource> = new Map();

export const addSearchableSource = (
  path: string,
  searchFields: string[],
  viewBase: string
) => {
  const key = path.split('/').filter(Boolean).at(-2) ?? path;
  sources.set(key, { path, searchFields, viewBase });
};

// Register your content sources here
addSearchableSource(getSafeUrl('/content/blog/index.ndjson'),      ['pageTitle', 'category', 'keywords'],        '/blog/');
addSearchableSource(getSafeUrl('/content/documents/index.ndjson'), ['pageTitle', 'pageDescription', 'keywords'], '/documents/');
addSearchableSource(getSafeUrl('/content/page/index.ndjson'),      ['pageTitle', 'pageDescription'],             '/page/');

// ---------------------------------------------------------------------------
// Streaming search
// ---------------------------------------------------------------------------

const streamNdjson = async (
  key: string,
  source: NdjsonSource,
  queryLower: string,
  limit = 5
): Promise<SearchResult[]> => {
  const results: SearchResult[] = [];

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
              label: record.pageTitle || String(id),
              href: getSafeUrl(`${source.viewBase}${id}`),
              sourceKey: key,
              id
            });

            if (results.length >= limit) {
              reader.cancel();
              break outer;
            }
          }
        } catch {
          // Malformed line — skip
        }
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
// Component
// ---------------------------------------------------------------------------

interface HeaderSearchProps {
  onNavigate?: () => void;
}

export const HeaderSearch: React.FC<HeaderSearchProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K focus + Escape dismiss — single consolidated listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close on outside click/tap — but only if the target is truly outside
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = ('touches' in e ? e.touches[0]?.target : e.target) as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    // Use touchend for mobile so it doesn't fire before result tap resolves
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchend', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchend', handler);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      const q = query.toLowerCase();

      const sourceMatches = await Promise.all(
        Array.from(sources.entries()).map(([key, source]) => streamNdjson(key, source, q))
      );

      const flat = sourceMatches.flat();
      setResults(flat);
      setOpen(flat.length > 0);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const handleSelect = (res: SearchResult) => {
    setQuery('');
    setOpen(false);
    onNavigate?.();
    window.location.href = res.href;
  };

  return (
    <div className="header-search" ref={containerRef}>
      <div className={`header-search__input-wrap ${open ? 'is-open' : ''}`}>
        <svg className="header-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="header-search__input"
          placeholder="Search..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search site"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {isSearching && <span className="header-search__spinner" aria-hidden="true" />}
        {query && !isSearching && (
          <button
            className="header-search__clear"
            // Prevent this from triggering the outside-click handler
            onMouseDown={e => e.stopPropagation()}
            onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus(); }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        <kbd className="header-search__kbd">⌘K</kbd>
      </div>

      {open && results.length > 0 && (
        <ul className="header-search__results" role="listbox">
          {results.map((res, i) => (
            <li
              key={`${res.sourceKey}-${i}`}
              className="header-search__result"
              role="option"
              // Prevent mousedown from firing the outside-click handler before onClick resolves
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleSelect(res)}
            >
              <span className="header-search__result-label">{res.label}</span>
              <span className={`header-search__result-tag header-search__result-tag--${res.sourceKey}`}>
                {getTag(res.sourceKey)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};