import { FC, useState, useEffect, useRef, useMemo } from 'react';
import { useHotKey } from '@hooks/use-hotkey';
import './style.scss';

interface NavConfig {
  label: string;
  href?: string;
  type: 'nav' | 'page' | 'db';
  elementId?: string;
  id?: number | string;
  contentType?: string;
}

/** * Configurable Search Indices
 * Key: API endpoint name
 * Value: Array of fields the backend should filter by
 */
const SEARCHABLE_INDICES: Record<string, string[]> = {
  page: ['pageTitle']
};

export const CommandSearch = ({ navigation }: { navigation: any[] }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<NavConfig[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedResult, setSelectedResult] = useState<NavConfig | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useHotKey(['ctrl', 'k'], () => inputRef.current?.focus());
  useHotKey(['meta', 'k'], () => inputRef.current?.focus());

  const flattenedNav = useMemo(() => {
    const flat: NavConfig[] = [];
    const recurse = (items: any[]) => {
      items.forEach(item => {
        if (item.href && item.href !== '#') {
          flat.push({ label: item.label, href: item.href, type: 'nav' });
        }
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
      const queryLower = query.toLowerCase();

      try {
        const indexKeys = Object.keys(SEARCHABLE_INDICES);

        const [navMatches, pageMatches, ...apiResultsStack] = await Promise.all([
          // 1. Local Nav
          Promise.resolve(flattenedNav.filter(p => p.label.toLowerCase().includes(queryLower))),

          // 2. DOM Search
          Promise.resolve((() => {
            const elements = document.querySelectorAll('h1, h2, h3, .cf-section__title, label, button');
            const matches: NavConfig[] = [];
            elements.forEach((el, idx) => {
              const text = el.textContent?.trim() || '';
              if (text.toLowerCase().includes(queryLower)) {
                if (!el.id) el.id = `search-ref-${idx}`;
                matches.push({ label: text, type: 'page', elementId: el.id, href: window.location.pathname });
              }
            });
            return matches;
          })()),

          // 3. Configurable Multi-API Stack
          ...indexKeys.map(async (type) => {
            try {
              // Construct filter object based on specified fields
              const fields = SEARCHABLE_INDICES[type];
              const filterObj: Record<string, string> = {};
              fields.forEach(field => { filterObj[field] = query; });

              const filter = JSON.stringify(filterObj);
              const res = await fetch(`/api/${type}?filter=${filter}&size=3`);
              const json = await res.json();
              
              if (!json.ok) return [];

              return json.results.map((r: any) => ({
                // Try each field from config as a potential label, fallback to ID
                label: r[fields[0]] || r.name || r.title || `ID: ${r.id}`,
                href: `/${type}/${r.id}`,
                id: r.id,
                type: 'db',
                contentType: type
              }));
            } catch (e) {
              return [];
            }
          })
        ]);

        setResults([...navMatches, ...pageMatches, ...apiResultsStack.flat()]);
      } catch (err) {
        console.error("Search stack failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, flattenedNav]);

  const handleAction = (actionType: 'view' | 'edit', res: NavConfig) => {
    if (res.type === 'page' && res.elementId) {
      const el = document.getElementById(res.elementId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.classList.add('search-highlight-flash');
      setTimeout(() => el?.classList.remove('search-highlight-flash'), 2000);
    }

    if (actionType === 'view') {
      window.open(res.href, '_blank');
    } else {
      let editPath = res.href;
      if (res.type === 'db') editPath = `/en-admin/${res.contentType}/${res.id}`;
      if (res.type === 'page') editPath = `${res.href}?edit=true#${res.elementId}`;
      
      window.location.pathname = editPath!;
    }

    setQuery('');
    setShowOverlay(false);
    setSelectedResult(null);
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
            setSelectedResult(null);
          }}
        />
        <kbd className="key-hint">⌘K</kbd>
      </div>

      {showOverlay && results.length > 0 ? (
        <div className="search-results-overlay">
          {selectedResult ? (
            <div className="action-prompt">
              <p>Action for <strong>{selectedResult.label}</strong></p>
              <div className="btn-group">
                <button onClick={() => handleAction('view', selectedResult)}>View in New Tab</button>
                <button onClick={() => handleAction('edit', selectedResult)} className="primary">
                  Edit {selectedResult.contentType || 'Item'}
                </button>
                <button onClick={() => setSelectedResult(null)} className="ghost">Cancel</button>
              </div>
            </div>
          ) : (
            <ul className="search-results-list">
              {results.map((res, i) => (
                <li key={`${res.type}-${i}`} onClick={() => setSelectedResult(res)}>
                  <div className="res-info">
                    <span className="res-label">{res.label}</span>
                    <span className="res-tag">
                      {res.type === 'page' ? 'Live on Page' : res.contentType || 'Menu'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
};