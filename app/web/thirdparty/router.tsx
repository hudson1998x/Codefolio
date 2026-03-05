import { useConfig, useModuleConfig } from '@config';
import React, { createContext, useContext, ReactNode, PropsWithChildren, FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import homepageconfig from './configs/homepage-config/config.json'
import { fetchContent } from './utils/fetch-content';

/**
 * Unified Page Content Interface
 * Handles both the raw node structure and the metadata-wrapped structure.
 */
export interface PageContent {
  component: string;
  data?: Record<string, any>;
  children?: PageContent[];
  pageTitle?: string;
  pageDescription?: string;
  [key: string]: any;
}

/**
 * The Router Hook
 * Fetches and normalizes data from /content/*.json
 */
export const useRouter = () => {
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [path, setPath] = useState(window.location.pathname);
  const homepage = useModuleConfig(homepageconfig.key, homepageconfig.config)
  const isAdmin = window.location?.pathname?.startsWith('/en-admin/') || window.location?.pathname === '/en-admin'

  const loadPage = useCallback(async (pathname: string) => {
    try {
      let normalized =
        pathname === "/"
          ? homepage.homepage + (isAdmin ? "/page.json" : ".json")
          : `${pathname.replace(/\/$/, "")}/` + (isAdmin ? "page.json" : ".json");

      normalized = normalized.replace('/.json', '.json')

      const res = await fetchContent(`/content${normalized}`);
      if (!res.ok) throw new Error("404");

      const rawData = await res.json();

      /**
       * --- NORMALIZATION LOGIC ---
       * Detects the new "Envelope" structure vs the old "Direct Tree" structure.
       */
      let processedContent: PageContent;

      // Case A: New CMS Structure (Metadata + Stringified JSON Content)
      if (rawData.content && typeof rawData.content === 'string') {
        try {
          const nodes = JSON.parse(rawData.content);
          processedContent = {
            component: "PageRoot", // Virtual wrapper for the array of nodes
            pageTitle: rawData.pageTitle || "Untitled Page",
            pageDescription: rawData.pageDescription || "",
            data: { 
                title: rawData.pageTitle, 
                id: rawData.id 
            },
            children: Array.isArray(nodes) ? nodes : [nodes]
          };
        } catch (e) {
          console.error("Failed to parse stringified content field:", e);
          throw new Error("Invalid JSON in content field");
        }
      } 
      // Case B: Top-level Array (Old CMS structure)
      else if (Array.isArray(rawData)) {
        processedContent = {
          component: "PageRoot",
          children: rawData
        };
      }
      // Case C: Already a single PageContent object
      else {
        processedContent = rawData;
      }

      setPageContent(processedContent);

    } catch (err) {
      console.warn(`Path ${pathname} not found, falling back to 404.`);
      try {
        const errorRes = await fetchContent(`/content/404/page.json`);
        const errorData = await errorRes.json();
        setPageContent(errorData);
      } catch {
        // Hard-coded last resort
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

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    loadPage(path);
  }, [path, loadPage]);

  const navigate = (to: string) => {
    if (to === path) return;
    window.history.pushState(null, '', to);
    setPath(to);
  };

  return { pageContent, navigate, path };
};

// --- Context ---

interface RouterContextValue {
  pageContent: PageContent | null;
  navigate: (to: string) => void;
  path: string;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export const RouterProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const value = useRouter();
  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouterContext = (): RouterContextValue => {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouterContext must be used within a RouterProvider');
  return context;
};

// --- Navigation Link ---

interface LinkProps extends PropsWithChildren {
  to: string;
  className?: string;
  onClick?: () => void;
}

export const Link: FC<LinkProps> = ({ to, children, className, onClick }) => {
  const { navigate, path } = useRouterContext();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow default behavior for cmd/ctrl clicks (open in new tab)
    if (e.metaKey || e.ctrlKey) return;

    e.preventDefault();
    if (to !== path) navigate(to);
    if (onClick) onClick();
  };

  return <a href={to} onClick={handleClick} className={className}>{children}</a>;
};