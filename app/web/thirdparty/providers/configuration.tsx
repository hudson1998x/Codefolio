import { createContext, FC, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { fetchContent } from "../utils/fetch-content";

/**
 * Top-level application configuration object fetched from `/build/config.json`.
 *
 * Keys are module/feature identifiers; values are arbitrary config shapes.
 * Replace the index signature with a strict union type once the full config
 * schema is known.
 *
 * @example
 * ```ts
 * interface AppConfig {
 *   featureFlags: FeatureFlagConfig;
 *   analytics: AnalyticsConfig;
 * }
 * ```
 */
export interface AppConfig {
  [key: string]: any;
}

/**
 * React context that distributes the fetched {@link AppConfig} through the
 * component tree. `null` indicates the config has not yet been loaded.
 *
 * Consumers should use {@link useConfig} rather than accessing this directly.
 */
const ConfigContext = createContext<AppConfig | null>(null);

/**
 * Returns the nearest {@link AppConfig} from context.
 *
 * Must be called within a {@link ConfigProvider}; throws otherwise to
 * surface misconfigured component trees early.
 *
 * @throws {Error} When called outside of a `ConfigProvider`.
 *
 * @example
 * ```ts
 * const config = useConfig();
 * console.log(config.featureFlags);
 * ```
 */
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};

/**
 * Fetches `/build/config.json` (cache-busted with `window.__CACHE_KEY__`) and
 * makes the result available to the subtree via {@link ConfigContext}.
 *
 * Renders `null` until the config has loaded successfully, preventing children
 * from mounting with an incomplete configuration. Errors are logged to the
 * console; in this case the component remains blank indefinitely — consider
 * adding an error boundary or fallback UI for production use.
 *
 * @example
 * ```tsx
 * <ConfigProvider>
 *   <App />
 * </ConfigProvider>
 * ```
 */
export const ConfigProvider: FC<PropsWithChildren> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);

  /**
   * Loads the remote config on mount. The `__CACHE_KEY__` query parameter
   * ensures the browser bypasses stale cached responses after a server deploy.
   */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetchContent("/build/config.json?cache=" + (window as any).__CACHE_KEY__);
        if (!res.ok) throw new Error("Failed to load config.json");
        const data: AppConfig = await res.json();
        setConfig(data);
      } catch (err) {
        console.error("⚠️ Error loading config:", err);
      }
    };

    loadConfig();
  }, []);

  if (!config) return null;

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
};

/**
 * Returns the configuration slice for a named module, merged over caller-supplied
 * defaults. Remote values take precedence over `defaultConfig`; any key absent
 * from the remote config retains its default value.
 *
 * The result is memoized and only recomputed when `config`, `key`, or
 * `defaultConfig` change.
 *
 * @typeParam T - The expected shape of the module's configuration object.
 * @param key - The top-level key in {@link AppConfig} that holds this module's config.
 * @param defaultConfig - Fallback values used when the remote config is absent
 *   or only partially defined.
 * @returns The merged configuration, typed as `T`.
 *
 * @example
 * ```ts
 * const { darkMode, itemsPerPage } = useModuleConfig('dashboard', {
 *   darkMode: false,
 *   itemsPerPage: 20,
 * });
 * ```
 */
export function useModuleConfig<T extends Record<string, any>>(
  key: string,
  defaultConfig: T
): T {
  const config = useConfig();

  return useMemo(() => {
    const moduleConfig = config?.[key];

    if (!moduleConfig) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...moduleConfig,
    };
  }, [config, key, defaultConfig]);
}