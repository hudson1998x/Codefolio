import { RouterProvider } from "@router";
import { WsListener } from "./components/ws-listener"
import { ConfigProvider } from "./providers/configuration"
import { ThemeLoader } from './theme';
import { Canvas } from "@components/canvas";
import './components/loader'
import './dev/module-generator'
import './autocontent/loader'
import './cms/blog-page'
import './pages/documentation'

/**
 * `Page` is the application root — it composes the full provider stack and
 * renders the top-level UI surface.
 *
 * The provider hierarchy is intentionally ordered from outermost to innermost:
 *
 * 1. **{@link WsListener}** — establishes the WebSocket connection for live
 *    reload and cache-key sync before anything else mounts.
 * 2. **{@link ConfigProvider}** — fetches and distributes `config.json`;
 *    blocks rendering until the config is available.
 * 3. **{@link RouterProvider}** — initialises client-side routing.
 * 4. **{@link ThemeLoader}** — resolves and applies the active theme.
 * 5. **{@link Canvas}** — the primary render surface where routed page content
 *    is painted.
 *
 * The `'./components/loader'` side-effect import registers any global loader
 * components or styles required before first paint.
 */
export const Page = () => {
    return (
        <WsListener>
            <ConfigProvider>
                <RouterProvider>
                    <ThemeLoader>
                        <Canvas></Canvas>
                    </ThemeLoader>
                </RouterProvider>
            </ConfigProvider>
        </WsListener>
    )
}