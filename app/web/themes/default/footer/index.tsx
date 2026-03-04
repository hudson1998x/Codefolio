import React from "react";
import { registerComponent } from '@components/registry';
import { useModuleConfig } from '@config';
import './style.scss';
/**
 * The default {@link FooterConfig} used when no `"footer"` key is present
 * in the site config, or to fill any missing fields via deep merge.
 *
 * Social links default to empty `href` values so they are hidden until
 * the user supplies their own URLs in `public/config.json`.
 */
import footerDefaults from './config.json'

/**
 * Represents a single social media link rendered in the footer.
 */
interface FooterSocialLink {
  /** The display label for the link (e.g. `"GitHub"`). */
  label: string;
  /** The URL the link points to. */
  href: string;
}

/**
 * Configuration contract for the {@link Footer} component, consumed via
 * {@link useModuleConfig} under the `"footer"` key.
 */
interface FooterConfig {
  /** The name displayed in the copyright notice. */
  copyrightName: string;
  /**
   * Social media links rendered in the footer. Any link with an empty or
   * absent `href` is hidden from the output. Omit the array entirely to
   * render no social links.
   */
  socials: FooterSocialLink[];
}

/**
 * Site-wide footer component rendered at the bottom of every page.
 *
 * Reads its configuration from the `"footer"` module config key, falling
 * back to {@link footerDefaults} for any missing values. Social links are
 * only rendered when their `href` is non-empty, so a user can selectively
 * show only the platforms they are active on.
 *
 * @remarks
 * To customise the footer, add a `"footer"` key to `public/config.json`:
 * ```json
 * {
 *   "footer": {
 *     "copyrightName": "Jane Doe",
 *     "socials": [
 *       { "label": "GitHub",   "href": "https://github.com/janedoe" },
 *       { "label": "LinkedIn", "href": "https://linkedin.com/in/janedoe" }
 *     ]
 *   }
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Rendered automatically by the active theme layout —
 * // no props required, all config is driven by useModuleConfig.
 * <Footer />
 * ```
 */
export const Footer: React.FC = () => {
  const config = useModuleConfig<FooterConfig>(footerDefaults.key, footerDefaults.config);

  // Only render social links that have a non-empty href supplied.
  const visibleSocials: FooterSocialLink[] = config.socials.filter((s: FooterSocialLink) => s.href.trim() !== "");

  return (
    <footer className="theme-footer border-top mt-auto py-4 bg-light">
      <div className="container">
        <div className="footer-content d-flex flex-column flex-md-row justify-content-between align-items-center">
          <p className="mb-0 text-muted">
            &copy; {new Date().getFullYear()} —{" "}
            <span className="fw-semibold">{config.copyrightName}</span>
          </p>

          {visibleSocials.length > 0 && (
            <div className="footer-socials d-flex gap-3 mt-3 mt-md-0">
              {visibleSocials.map((social: FooterSocialLink) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-decoration-none text-secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

registerComponent({
  name: "footer",
  defaults: footerDefaults,
  component: Footer as React.FC<any>,
});