import { useState, useEffect, useRef, useMemo } from 'react';
import { useHotKey } from '@hooks/use-hotkey';
import './style.scss';

interface SearchResult {
  label: string;
  href: string;
  sourceKey: string;
  id?: number | string;
  elementId?: string;
}

interface NdjsonSource {
  path: string;
  searchFields: string[];
  editBase: string;
  viewBase: string;
}

const sources: Map<string, NdjsonSource> = new Map();

const addSearchableSource = (
  path: string,
  searchFields: string[],
  editBase: string,
  viewBase: string
) => {
  // Derive a stable key from the path e.g. '/content/blog/index.ndjson' => 'blog'
  const key = path.split('/').filter(Boolean).at(-2) ?? path;
  sources.set(key, { path, searchFields, editBase, viewBase });
};

// --- Register sources here ---
addSearchableSource('/content/blog/index.ndjson',      ['pageTitle', 'category', 'keywords'],      '/en-admin/blog',      '/blog/');
addSearchableSource('/content/documents/index.ndjson', ['pageTitle', 'pageDescription', 'keywords'], '/en-admin/documents', '/documents/');
addSearchableSource('/content/page/index.ndjson',      ['pageTitle', 'pageDescription'],            '/en-admin/page',      '/page/');

/**
 * Stream an NDJSON file line by line, cancelling once `limit` results are found.
 */
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
              href: `${source.viewBase}${id}`,
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

export const CommandSearch = ({ navigation }: { navigation: any[] }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useHotKey(['ctrl', 'k'], () => inputRef.current?.focus());
  useHotKey(['meta', 'k'], () => inputRef.current?.focus());

  const flattenedNav = useMemo(() => {
    const flat: SearchResult[] = [];
    const recurse = (items: any[]) => {
      items.forEach(item => {
        if (item.href && item.href !== '#') flat.push({ label: item.label, href: item.href, sourceKey: 'nav' });
        if (item.children) recurse(item.children);
      });
    };
    recurse(navigation);
    return flat;
  }, [navigation]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowOverlay(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      setShowOverlay(true);
      const q = query.toLowerCase();

      const navMatches = flattenedNav.filter(r => r.label.toLowerCase().includes(q));

      const domMatches: SearchResult[] = [];
      document.querySelectorAll('h1, h2, h3, .cf-section__title, label, button').forEach((el, idx) => {
        const text = el.textContent?.trim() || '';
        if (text.toLowerCase().includes(q)) {
          if (!el.id) el.id = `search-ref-${idx}`;
          domMatches.push({ label: text, sourceKey: 'dom', elementId: el.id, href: window.location.pathname });
        }
      });

      const sourceMatches = await Promise.all(
        Array.from(sources.entries()).map(([key, source]) => streamNdjson(key, source, q))
      );

      setResults([...navMatches, ...domMatches, ...sourceMatches.flat()]);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(handler);
  }, [query, flattenedNav]);

  const handleAction = (actionType: 'view' | 'edit', res: SearchResult) => {
    if (res.sourceKey === 'dom' && res.elementId) {
      const el = document.getElementById(res.elementId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.classList.add('search-highlight-flash');
      setTimeout(() => el?.classList.remove('search-highlight-flash'), 2000);
    }

    if (actionType === 'view') {
      window.open(res.href, '_blank');
    } else {
      const source = sources.get(res.sourceKey);
      const editPath = source
        ? `${source.editBase}/${res.id}`
        : res.href;

      window.location.pathname = editPath;
    }

    setQuery('');
    setShowOverlay(false);
    setSelected(null);
  };

  const getTag = (res: SearchResult) => {
    if (res.sourceKey === 'dom') return 'Live on Page';
    if (res.sourceKey === 'nav') return 'Menu';
    // Capitalise the source key for display e.g. 'blog' => 'Blog'
    return res.sourceKey.charAt(0).toUpperCase() + res.sourceKey.slice(1);
  };

  return (
    <div className="command-search-container">
      <div className="command-search">
        <span className="search-icon">{isSearching ? '⌛' : '⚲'}</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
        />
        <kbd className="key-hint">⌘K</kbd>
      </div>

      {showOverlay && results.length > 0 && (
        <div className="search-results-overlay">
          {selected ? (
            <div className="action-prompt">
              <p>Action for <strong>{selected.label}</strong></p>
              <div className="btn-group">
                <button onClick={() => handleAction('view', selected)}>View in New Tab</button>
                <button onClick={() => handleAction('edit', selected)} className="primary">
                  Edit {selected.sourceKey}
                </button>
                <button onClick={() => setSelected(null)} className="ghost">Cancel</button>
              </div>
            </div>
          ) : (
            <ul className="search-results-list">
              {results.map((res, i) => (
                <li key={`${res.sourceKey}-${i}`} onClick={() => setSelected(res)}>
                  <div className="res-info">
                    <span className="res-label">{res.label}</span>
                    <span className="res-tag">{getTag(res)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};