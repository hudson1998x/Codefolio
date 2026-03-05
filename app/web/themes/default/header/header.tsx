import React from "react";
import { registerComponent } from '@components/registry';
import { useModuleConfig } from '@config';
import { useRouter } from "@router";
import './style.scss';

import headerDefaults from './config.json';
import { getSafeUrl } from "app/web/thirdparty/utils/safe-url";

/**
 * Represents a single navigation link in the {@link Header}.
 *
 * A link can be text-only, icon-only, or both. Links with an external
 * `to` value (i.e. starting with `http`) are rendered as `<a>` tags,
 * while internal links are rendered as router-aware buttons.
 */
interface Link {
  /** The destination URL or internal path (e.g. `"/work"` or `"https://github.com"`). */
  to: string;
  /** Optional display label rendered as a `<span>` alongside or instead of an icon. */
  label?: string;
  /** Optional Font Awesome icon class rendered as an `<i>` tag (e.g. `"fab fa-github"`). */
  icon?: string;
}

/**
 * Configuration contract for the {@link Header} component, consumed via
 * {@link useModuleConfig} under the `"header"` key.
 */
interface HeaderConfig {
  /** The site title displayed as the logo/wordmark in the header. */
  siteTitle: string;
  /**
   * Ordered list of navigation links rendered in the header nav.
   * Supports both internal routes and external URLs, with optional
   * icon-only entries for social/external links.
   */
  links: Link[];
}

/**
 * Site-wide header component rendered at the top of every page.
 *
 * Reads its configuration from the `"header"` module config key, falling
 * back to {@link headerDefaults} for any missing values. The active route
 * is highlighted automatically by comparing each link's `to` value against
 * the current router path.
 *
 * @remarks
 * To customise the header, add a `"header"` key to `public/config.json`:
 * ```json
 * {
 *   "header": {
 *     "siteTitle": "Jane Doe",
 *     "links": [
 *       { "to": "/work",                "label": "Work"  },
 *       { "to": "https://github.com",   "icon": "fab fa-github" }
 *     ]
 *   }
 * }
 * ```
 *
 * External links (those beginning with `http`) open in a new tab
 * automatically. Internal links highlight when the current path matches
 * their `to` value exactly.
 *
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export const Header: React.FC = () => {
  const { path } = useRouter();
  const config = useModuleConfig<HeaderConfig>(headerDefaults.key, headerDefaults.config);

  const isExternal = (to: string) => to.startsWith("http");

  return (
    <header className="theme-header border-bottom shadow-sm">
      <div className="container d-flex justify-content-between align-items-center py-3">
        <div className="nav-logo h4 mb-0 fw-bold text-uppercase">
          <a href={getSafeUrl('/')}>{config.siteTitle}</a>
        </div>

        <nav className="nav nav-tabs border-0">
          {config?.links?.map((item: Link) => (
            isExternal(item.to) ? (
              <a
                key={item.to}
                href={item.to}
                className={"nav-link border-0" + (Boolean(item.icon && item.label) ? ' iconised-label' : '')}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.icon  ? <i className={item.icon} /> : null}
                {item.label ? <span>{item.label}</span>  : null}
              </a>
            ) : (
              <a
                key={item.to}
                href={getSafeUrl(item.to)}
                className={"nav-link border-0" + (Boolean(item.icon && item.label) ? ' iconised-label' : '')}
                rel="noopener noreferrer"
              >
                {item.icon  ? <i className={item.icon} /> : null}
                {item.label ? <span>{item.label}</span>  : null}
              </a>
            )
          ))}
        </nav>
      </div>
    </header>
  );
};

registerComponent({
  name:      "header",
  defaults:  headerDefaults,
  component: Header as React.FC<any>,
});