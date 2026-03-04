import { useState, useEffect, useRef } from 'react';
import './style.scss';
import { useHotKey } from '@hooks/use-hotkey';
import { VcsStatusBar } from '../components/vcs-status';

/**
 * Shape of a single navigation entry returned by `/en-admin/nav.json`.
 * Items may be nested arbitrarily deep via the `children` array.
 */
interface NavConfig {
  /** Display text rendered inside the anchor element. */
  label: string;
  /** Destination URL. Defaults to `"#"` when omitted. */
  href?: string;
  /** Optional icon identifier (reserved for future use). */
  icon?: string;
  /** Nested navigation items that render as a dropdown. */
  children?: NavConfig[];
}

/**
 * `AdminHeader` is the top-level chrome for the CodeFolio admin platform.
 *
 * Responsibilities:
 * - **Dynamic navigation** — fetches a `NavConfig[]` tree from `/en-admin/nav.json`
 *   and renders it with recursive dropdown support.
 * - **Live sync state** — connects to the `ws://<host>/ws` WebSocket and toggles
 *   a "Syncing / Synced" indicator in response to `SAVING_START` / `SAVING_END`
 *   broadcast messages. Also detects server-side cache key rotations.
 * - **Command search** — renders a "Jump to…" input focused by `⌘K` / `Ctrl+K`
 *   via {@link useHotKey}.
 * - **VCS status** — embeds {@link VcsStatusBar} for at-a-glance repository state.
 * - **Deploy action** — "Ship Changes" CTA button.
 */
export const AdminHeader = () => {
  /** `true` while a `SAVING_START` WebSocket event is in flight. */
  const [isSaving, setIsSaving] = useState(false);
  /** Navigation tree hydrated from the remote config endpoint. */
  const [navigation, setNavigation] = useState<NavConfig[]>([]);
  /** Ref forwarded to the command-search `<input>` for programmatic focus. */
  const searchInputRef = useRef<HTMLInputElement>(null);

  /**
   * Fetches the navigation configuration from `/en-admin/nav.json` on mount.
   * On success, hydrates the `navigation` state; errors are swallowed and
   * logged — the header renders a skeleton placeholder in the interim.
   */
  useEffect(() => {
    const fetchNav = async () => {
      try {
        const response = await fetch('/en-admin/nav.json');
        if (!response.ok) throw new Error('Failed to load nav');
        const data = await response.json();
        setNavigation(data);
      } catch (err) {
        console.error('Nav Fetch Error:', err);
      }
    };

    fetchNav();
  }, []);

  /**
   * Opens a WebSocket connection to `ws://<host>/ws` and subscribes to two
   * message shapes:
   *
   * - **JSON `{ type: "cacheKey", key: string }`** — logs a warning when the
   *   server-side cache key diverges from the client's `window.__CACHE_KEY__`.
   *   A full page reload is commented out but available if needed.
   * - **Plain strings** — `"SAVING_START"` / `"SAVING_END"` toggle the
   *   `isSaving` flag that drives the Syncing / Synced indicator.
   *
   * The connection is closed on component unmount via the effect's cleanup.
   */
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'cacheKey' && (window as Record<string, any>).__CACHE_KEY__ && data.key !== (window as Record<string, any>).__CACHE_KEY__) {
          console.log('Server updated, refreshing UI...');
          // window.location.reload();
        }
      } catch (e) {
        // Handle non-JSON broadcast messages
        if (event.data === 'SAVING_START') setIsSaving(true);
        if (event.data === 'SAVING_END') setIsSaving(false);
      }
    };

    return () => ws.close();
  }, []);

  /** Focus the command-search input on `Ctrl+K`. */
  useHotKey(['ctrl', 'k'], () => searchInputRef.current?.focus());
  /** Focus the command-search input on `⌘K` (macOS). */
  useHotKey(['meta', 'k'], () => searchInputRef.current?.focus());

  /**
   * Recursively renders a `NavConfig[]` tree as a nested `<ul>` structure.
   * Items with `children` receive a chevron indicator and a dropdown wrapper
   * that is shown / hidden via CSS.
   *
   * @param props.items - The slice of the navigation tree to render at this level.
   */
  const RenderNavItems = ({ items }: { items: NavConfig[] }) => (
    <ul className="nav-list">
      {items.map((item, index) => (
        <li key={index} className="nav-item-wrapper">
          <a href={item.href || '#'} className="nav-link">
            {item.label}
            {item.children && item.children.length > 0 && <span className="chevron">▾</span>}
          </a>
          {item.children && item.children.length > 0 && (
            <div className="nav-dropdown">
              <RenderNavItems items={item.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <header className="platform-header">
      <div className="header-left">
        <div className="workspace-switcher">
          <div className="logo-box">CF</div>
          <div className="label-group">
            <span className="title">CodeFolio</span>
            <span className="status">Dev Mode</span>
          </div>
        </div>

        <nav className="dynamic-nav">
          {navigation.length > 0 ? (
            <RenderNavItems items={navigation} />
          ) : (
            /* Placeholder skeleton shown while nav data is loading. */
            <div className="nav-skeleton" style={{ width: '200px', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
          )}
        </nav>
      </div>

      <div className="header-center">
        {/* Clicking anywhere on the wrapper also focuses the input. */}
        <div className="command-search" onClick={() => searchInputRef.current?.focus()}>
          <span className="search-icon">⚲</span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Jump to..."
          />
          <kbd className="key-hint">⌘K</kbd>
        </div>
      </div>

      <div className="header-right">
        <div className="system-indicators">
          {/* Toggles between "Syncing…" and "Synced" via WebSocket events. */}
          <div className={`save-status ${isSaving ? 'is-saving' : ''}`}>
            {isSaving ? 'Syncing...' : 'Synced'}
          </div>
          <VcsStatusBar />
        </div>

        <button className="deploy-btn">Ship Changes</button>

        <div className="profile-pill">
          <img src="https://api.dicebear.com/7.x/shapes/svg?seed=noir" alt="User" />
        </div>
      </div>
    </header>
  );
};