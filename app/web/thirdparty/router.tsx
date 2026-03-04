import { createContext, useContext, ReactNode, PropsWithChildren, FC } from 'react';
import { useEffect, useState, useCallback } from 'react';

/**
 * Describes a single node in the server-driven page content tree.
 *
 * Each node names a client-side component to render (`component`) and carries
 * optional data props and nested child nodes, enabling recursive page
 * composition from a single JSON payload.
 *
 * @example
 * ```json
 * {
 *   "component": "HeroSection",
 *   "data": { "title": "Hello" },
 *   "children": [{ "component": "CtaButton", "data": { "label": "Go" } }]
 * }
 * ```
 */
export interface PageContent {
  /** Name of the client-side component responsible for rendering this node. */
  component: string;
  /** Arbitrary props forwarded to the component. */
  data?: Record<string, any>;
  /** Nested content nodes for recursive composition. */
  children?: PageContent[];
  /** Allows additional top-level keys for forward-compatibility. */
  [key: string]: any;
}

/**
 * Core client-side router built on the History API.
 *
 * Resolves the current `pathname` to a `page.json` file under `/content/`,
 * fetches it, and exposes the result as `pageContent`. Navigation is handled
 * via `pushState` so no full page reload occurs.
 *
 * **URL → file mapping:**
 * - `"/"` → `/content/page.json`
 * - `"/about"` → `/content/about/page.json`
 * - `"/blog/post-1"` → `/content/blog/post-1/page.json`
 *
 * **Error handling (waterfall):**
 * 1. Attempts to fetch the resolved `page.json`.
 * 2. On failure, fetches `/content/404/page.json`.
 * 3. If that also fails, falls back to a hard-coded `ErrorPage` content node.
 *
 * @returns `pageContent` — the resolved page tree (or `null` while loading),
 *   `navigate` — programmatic navigation function,
 *   `path` — the current pathname.
 */
export const useRouter = () => {
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [path, setPath] = useState(window.location.pathname);

  /**
   * Fetches the content JSON for the given pathname, following the
   * normalisation rules and error-waterfall described on {@link useRouter}.
   *
   * Wrapped in `useCallback` so the stable reference can be safely listed as
   * a `useEffect` dependency without triggering infinite re-fetches.
   *
   * @param pathname - An absolute pathname (e.g. `"/blog/post-1"`).
   */
  const loadPage = useCallback(async (pathname: string) => {
    try {
      const normalized =
        pathname === "/"
          ? "/page.json"
          : `${pathname.replace(/\/$/, "")}/page.json`;

      const res = await fetch(`/content${normalized}`);

      if (!res.ok) {
        throw new Error("404");
      }

      const data: PageContent = await res.json();
      setPageContent(data);
    } catch (err) {
      console.warn(`Path ${pathname} not found, attempting to load 404.json`);

      try {
        const errorRes = await fetch(`/content/404/page.json`);
        if (!errorRes.ok) throw new Error("No 404 JSON found");

        const errorData: PageContent = await errorRes.json();
        setPageContent(errorData);
      } catch {
        /** Hard-coded last-resort fallback when no 404 content is configured. */
        setPageContent({
          component: "ErrorPage",
          data: {
            title: "404",
            message: "Page not found and no 404 content configured.",
          },
          children: [],
        });
      }
    }
  }, []);

  /** Syncs `path` state with browser back/forward navigation. */
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  /** Re-fetches page content whenever the active path changes. */
  useEffect(() => {
    loadPage(path);
  }, [path, loadPage]);

  /**
   * Navigates to the given path using `history.pushState`.
   * No-ops when `to` matches the current path to prevent redundant fetches.
   *
   * @param to - Absolute pathname to navigate to (e.g. `"/contact"`).
   */
  const navigate = (to: string) => {
    if (to === path) return;
    window.history.pushState(null, '', to);
    setPath(to);
  };

  return { pageContent, navigate, path };
};

// --- Context & Provider ---

/**
 * Value shape distributed by {@link RouterContext} to all consuming components.
 */
interface RouterContextValue {
  /** The resolved content tree for the current route, or `null` while loading. */
  pageContent: PageContent | null;
  /** Programmatic navigation — see {@link useRouter.navigate}. */
  navigate: (to: string) => void;
  /** The currently active pathname. */
  path: string;
}

/**
 * Internal context — consume via {@link useRouterContext} or {@link Link},
 * never directly.
 */
const RouterContext = createContext<RouterContextValue | undefined>(undefined);

/**
 * Instantiates {@link useRouter} and makes its return value available to the
 * subtree via {@link RouterContext}.
 *
 * Should be placed high in the tree, inside {@link ConfigProvider} and outside
 * any route-aware components.
 *
 * @example
 * ```tsx
 * <RouterProvider>
 *   <ThemeLoader>
 *     <Canvas />
 *   </ThemeLoader>
 * </RouterProvider>
 * ```
 */
export const RouterProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { pageContent, navigate, path } = useRouter();
  return (
    <RouterContext.Provider value={{ pageContent, navigate, path }}>
      {children}
    </RouterContext.Provider>
  );
};

/**
 * Returns the {@link RouterContextValue} from the nearest {@link RouterProvider}.
 *
 * @throws {Error} When called outside of a `RouterProvider`.
 *
 * @example
 * ```ts
 * const { navigate, path } = useRouterContext();
 * ```
 */
export const useRouterContext = (): RouterContextValue => {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouterContext must be used within a RouterProvider');
  return context;
};

// --- Link Component ---

/**
 * Props accepted by the {@link Link} component.
 */
interface LinkProps extends PropsWithChildren {
  /** Absolute pathname to navigate to on click. */
  to: string;
  /** Optional CSS class forwarded to the underlying `<a>` element. */
  className?: string;
  /** Optional callback invoked after navigation, e.g. to close a menu. */
  onClick?: () => void;
}

/**
 * Client-side navigation anchor that delegates to {@link useRouterContext}.
 *
 * Prevents the default browser navigation and calls `navigate` instead,
 * keeping the app in a single-page context. No-ops when `to` matches the
 * current path. The `href` attribute is still set for accessibility and
 * right-click / open-in-new-tab support.
 *
 * @example
 * ```tsx
 * <Link to="/about" className="nav-link">About</Link>
 * ```
 */
export const Link: FC<LinkProps> = ({ to, children, className, onClick }) => {
  const { navigate, path } = useRouterContext();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    if (to !== path) navigate(to);
    if (onClick) onClick();
  };

  return <a href={to} onClick={handleClick} className={className}>{children}</a>;
};