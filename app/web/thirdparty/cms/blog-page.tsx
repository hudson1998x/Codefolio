import { registerComponent } from "@components/registry";
import { FC, useEffect, useState, useMemo, useRef, useCallback } from "react";
import './style.scss';
import { fetchContent } from "../utils/fetch-content";
import { getSafeUrl } from "../utils/safe-url";

interface BlogEntry {
  id: number;
  pageTitle: string;
  pageDescription: string;
  keywords: string;
  category?: string;
  tags?: string[];
  content: string; 
}

const INITIAL_BATCH = 8;
const LOAD_MORE_COUNT = 4;

const BlogPage: FC<{}> = () => {
  const [entries, setEntries] = useState<BlogEntry[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Intersection Observer Ref
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBlogIndex = async () => {
      setIsInitialLoading(true);
      setIsStreaming(true);
      
      try {
        const response = await fetchContent('/content/blog/index.ndjson');
        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let remainingText = '';
        let chunkResults: BlogEntry[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          remainingText += decoder.decode(value, { stream: true });
          const lines = remainingText.split('\n');
          remainingText = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                chunkResults.push(JSON.parse(line));
              } catch (e) { console.error("Parse error", e); }
            }
          }

          if (chunkResults.length >= 10) {
            setEntries(prev => [...prev, ...chunkResults]);
            chunkResults = [];
            setIsInitialLoading(false); 
          }
        }

        if (chunkResults.length > 0) {
          setEntries(prev => [...prev, ...chunkResults]);
        }
      } catch (err) {
        console.error("Stream error:", err);
      } finally {
        setIsInitialLoading(false);
        setIsStreaming(false);
      }
    };

    fetchBlogIndex();
  }, []);

  // --- Data Aggregation ---
  const { categories, allTags } = useMemo(() => {
    const catMap: Record<string, number> = { "All": entries.length };
    const tagMap: Record<string, number> = {};
    
    entries.forEach(entry => {
      if (entry.category) catMap[entry.category] = (catMap[entry.category] || 0) + 1;
      if (entry.tags) entry.tags.forEach(t => tagMap[t] = (tagMap[t] || 0) + 1);
    });

    return { 
      categories: Object.entries(catMap).sort(([a], [b]) => a.localeCompare(b)),
      allTags: Object.entries(tagMap).sort(([a], [b]) => a.localeCompare(b)) 
    };
  }, [entries]);

  // --- Filtered List ---
  const filteredEntries = useMemo(() => {
    return entries.filter(post => {
      const matchesSearch = !searchQuery || 
        [post.pageTitle, post.pageDescription, post.keywords].some(f => 
          f?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesCategory = activeCategory === "All" || post.category === activeCategory;
      const matchesTag = !activeTag || post.tags?.includes(activeTag);
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [searchQuery, activeCategory, activeTag, entries]);

  // Infinite Scroll Observer
  const handleObserver = useCallback((entities: IntersectionObserverEntry[]) => {
    const target = entities[0];
    if (target.isIntersecting) {
      setVisibleCount(prev => prev + LOAD_MORE_COUNT);
    }
  }, []);

  useEffect(() => {
    const option = { root: null, rootMargin: "20px", threshold: 1.0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Reset visible count when filters change
  useEffect(() => setVisibleCount(INITIAL_BATCH), [searchQuery, activeCategory, activeTag]);

  const currentVisibleData = filteredEntries.slice(0, visibleCount);

  if (isInitialLoading) return <div className="blog-index loading-state"><div className="spinner"></div></div>;

  return (
    <div className='blog-index'>
      {isStreaming && <div className="streaming-indicator">Syncing articles...</div>}
      
      <header className="blog-header">
        <h1>Blog</h1>
        <div className="filter-controls">
          <div className="search-wrapper">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="search-input"
            />
          </div>
          <select className="category-select" value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
            {categories.map(([name, count]) => (
              <option key={name} value={name}>{name} ({count})</option>
            ))}
          </select>
        </div>
        
        <div className="tag-cloud">
          <button className={!activeTag ? 'active' : ''} onClick={() => setActiveTag(null)}>#all</button>
          {allTags.map(([tag, count]) => (
            <button key={tag} className={activeTag === tag ? 'active' : ''} onClick={() => setActiveTag(tag)}>
              #{tag} <small>({count})</small>
            </button>
          ))}
        </div>
      </header>
      
      <div className="blog-grid">
        {currentVisibleData.map((post) => (
          <article key={post.id} className="blog-card">
            <div className="card-inner">
              {post.category && <span className="category-label">{post.category}</span>}
              <h3>{post.pageTitle}</h3>
              {/* Corrected Fallback */}
              <p>{post.pageDescription || "Explore this article to learn more about our latest insights and project updates..."}</p>
              <div className="card-footer">
                <div className="tags-list">
                  {post.tags?.slice(0, 2).map(t => <span key={t} className="tag-pill">#{t}</span>)}
                </div>
                <a href={getSafeUrl(`/blog/${post.id}`)} className="read-link">Read More</a>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      {visibleCount < filteredEntries.length && (
        <div ref={loaderRef} className="infinite-loader">
          <div className="dot-pulse"></div>
        </div>
      )}

      {filteredEntries.length === 0 && (
        <div className="empty-state">
          <p>No matches found for your current filters.</p>
        </div>
      )}
    </div>
  );
};

registerComponent({ component: BlogPage, name: 'Blog/Index', defaults: {} });