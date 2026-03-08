import { FC, PropsWithChildren, useEffect, useState } from "react";

/**
 * `WsListener` is a transparent layout component that opens a WebSocket
 * connection for the lifetime of the tree it wraps, enabling live-reload
 * and cache-key synchronisation without adding any DOM nodes of its own.
 *
 * **Localhost only** — the WebSocket connection is only attempted when the
 * page is served from `localhost` or `127.0.0.1`. On any other host the
 * component renders its children immediately with no side-effects.
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
 * A disconnect banner is shown if the socket drops while on localhost.
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
  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    if (!isLocalhost) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("🟢 WebSocket connected for live reload");
      setDisconnected(false);
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
      setDisconnected(true);
    };

    return () => ws.close();
  }, []);

  return (
    <>
      {children}
      {isLocalhost && disconnected && (
        <div style={{
          position:     "fixed",
          bottom:       "1.25rem",
          left:         "50%",
          transform:    "translateX(-50%)",
          background:   "#1e293b",
          color:        "#f8fafc",
          padding:      "0.65rem 1.25rem",
          borderRadius: "8px",
          fontSize:     "0.8rem",
          fontFamily:   "system-ui, sans-serif",
          boxShadow:    "0 4px 12px rgba(0,0,0,0.25)",
          display:      "flex",
          alignItems:   "center",
          gap:          "0.6rem",
          zIndex:       99999,
          pointerEvents: "none",
        }}>
          <span style={{ color: "#ef4444", fontSize: "0.65rem" }}>●</span>
          WebSocket disconnected — please restart the server.
        </div>
      )}
    </>
  );
};