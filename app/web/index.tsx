/**
 * Application entry point.
 *
 * Mounts the React tree into the `#root` DOM element and kicks off the full
 * provider + routing stack via {@link Page}.
 *
 * The `'./themes/'` side-effect import registers all available themes with the
 * theme engine before the first render, ensuring {@link ThemeLoader} can
 * resolve the active theme synchronously.
 */

import { createRoot } from "react-dom/client";
import { Page } from "./thirdparty/page";
import './themes/';

const root = createRoot(document.getElementById("root")!);

root.render(<Page />);