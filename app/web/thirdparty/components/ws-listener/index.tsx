import { FC, PropsWithChildren, useEffect } from "react";

/**
 * `WsListener` is a transparent layout component that opens a WebSocket
 * connection for the lifetime of the tree it wraps, enabling live-reload
 * and cache-key synchronisation without adding any DOM nodes of its own.
 *
 * **Connection URL** — derived at runtime from `window.location`:
 * - `https:` pages connect via `wss://`
 * - `http:` pages connect via `ws://`
 *
 * **Message protocol** — two message shapes are handled:
 * - **JSON `{ type: "cacheKey", key: string }`** — stores the received key on
 *   `window.__CACHE_KEY__` so other parts of the app can detect server-side
 *   cache rotations.
 * - **Plain string `"reload"`** — triggers `window.location.reload()` to pick
 *   up freshly built assets during development.
 *
 * The socket is closed automatically when the component unmounts.
 *
 * @example
 * ```tsx
 * // Wrap the application root to enable live reload across the whole app.
 * <WsListener>
 *   <App />
 * </WsListener>
 * ```
 */
export const WsListener: FC<PropsWithChildren> = ({ children }) => {
  /**
   * Opens the WebSocket connection on mount and registers all event handlers.
   * Runs once — the empty dependency array ensures it is never re-executed.
   * The returned cleanup function closes the socket on unmount.
   */
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("🟢 WebSocket connected for live reload");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "cacheKey") {
          /** Persists the latest cache key globally for cross-component access. */
          (window as any).__CACHE_KEY__ = data.key;
          console.log("🔑 Received cache key:", data.key);
        }
      } catch {
        // Non-JSON messages are treated as plain reload signals.
        if (event.data === "reload") {
          console.log("🔄 Page reload triggered by WebSocket");
          window.location.reload();
        }
      }
    };

    ws.onclose = () => {
      console.warn("🔴 WebSocket disconnected, live reload will stop");
    };

    return () => ws.close();
  }, []);

  return <>{children}</>;
};