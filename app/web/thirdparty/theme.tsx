import { FC, PropsWithChildren } from "react";
import { useConfig } from "./providers/configuration";
import { useRouter } from '@router'

/**
 * Internal registry mapping theme names to their root layout components.
 * Populated at module initialisation time via {@link registerTheme}.
 *
 * @internal
 */
const _themeRoots: Record<string, FC<PropsWithChildren>> = {};

/**
 * Registers a theme layout component under a given name, making it
 * available to {@link ThemeLoader} for runtime resolution.
 *
 * @remarks
 * Two theme names are reserved by the framework:
 * - `"default"` — applied to all public-facing pages.
 * - `"@admin"`  — applied automatically to all `/en-admin` routes.
 *
 * Any name beyond these is user-defined and must be referenced by the
 * `theme` key in the site config to take effect.
 *
 * @param name  - The unique identifier for this theme.
 * @param theme - The root layout component to render for this theme.
 *
 * @example
 * ```ts
 * registerTheme("default", DefaultLayout);
 * registerTheme("@admin", AdminLayout);
 * registerTheme("minimal", MinimalLayout);
 * ```
 */
export const registerTheme = (name: string, theme: FC<PropsWithChildren>) => {
  _themeRoots[name] = theme;
};

/**
 * Resolves and applies the correct theme layout for the current route.
 *
 * Theme resolution follows this priority order:
 * 1. The `theme` key from site config, if present.
 * 2. `"@admin"` — applied automatically when the current path is `/en-admin`
 *    or any path beneath it, regardless of config.
 * 3. `"default"` — the fallback for all public routes.
 *
 * If the resolved theme is not found in the registry, a warning is logged
 * and `"default"` is tried. If `"default"` is also absent, children are
 * rendered unwrapped.
 *
 * @remarks
 * Theme switching is automatic for admin routes — no config change is needed
 * to get the admin layout on `/en-admin` pages. This means the admin UI is
 * always visually isolated from the public site regardless of user config.
 *
 * @example
 * ```tsx
 * // Wrap your application root with ThemeLoader
 * <ThemeLoader>
 *   <RouterOutlet />
 * </ThemeLoader>
 * ```
 */
export const ThemeLoader: FC<PropsWithChildren> = ({ children }) => {
  const config = useConfig();
  const { path } = useRouter();

  let themeName = config?.theme?.theme ?? (
    path.startsWith('/en-admin/') || path === '/en-admin'
      ? "@admin"
      : "default"
  );

  if (path.startsWith('/en-admin/') || path == '/en-admin')
  {
    themeName = "@admin";
  }
  
  const Theme = _themeRoots[themeName];

  if (!Theme) {
    console.warn(`Theme "${themeName}" not found, falling back to default`);
    const Fallback = _themeRoots["default"];
    return Fallback ? <Fallback>{children}</Fallback> : <>{children}</>;
  }

  return <Theme>{children}</Theme>;
};