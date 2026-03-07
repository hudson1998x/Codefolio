import { registerTheme } from "app/web/thirdparty/theme";
import { AdminHeader } from "./header";
import { FC, PropsWithChildren } from "react";
import './pages/config/config.scss'
import './pages/media-gallery'
import './pages/dashboard'
import './components/loader'
import './components/documentation-selector'
import './style.scss'

/**
 * Root layout wrapper for the CodeFolio admin interface.
 *
 * Composes the persistent {@link AdminHeader} with an arbitrary page body,
 * then registers itself as the `"@admin"` theme so the theme engine can
 * inject it automatically around any admin route.
 *
 * @example
 * ```tsx
 * // Consumed implicitly via the theme registry — no manual wrapping needed.
 * registerTheme('@admin', AdminThemeWrapper);
 *
 * // Or used directly in tests / Storybook:
 * <AdminThemeWrapper>
 *   <SettingsPage />
 * </AdminThemeWrapper>
 * ```
 */
export const AdminThemeWrapper: FC<PropsWithChildren> = (props) => {
    return (
        <div className='codefolio-default-admin'>
            <AdminHeader />
            <div className='content'>
                {props.children}
            </div>
        </div>
    )
}

/**
 * Registers {@link AdminThemeWrapper} under the `"@admin"` theme key.
 * After this call, the theme engine will automatically wrap any view
 * that declares `@admin` as its theme with this layout.
 */
registerTheme('@admin', AdminThemeWrapper);