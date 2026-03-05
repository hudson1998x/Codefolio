import React, { useState } from "react";
import './style.scss';
import { registerComponent } from "@components/registry";

export interface FigmaEmbedData {
  /**
   * The public Figma file, design, or prototype URL to embed.
   * Must be a `figma.com/file`, `figma.com/design`, or `figma.com/proto` URL
   * with sharing set to "Anyone with the link can view".
   */
  url: string;

  /**
   * Height of the embed iframe in pixels.
   * @default "600"
   */
  height: string;

  /**
   * Whether to show the "Open in Figma" button overlay once the embed has loaded,
   * and as a fallback link when the embed is blocked.
   * Accepts `"true"` or `"false"` as a string.
   * @default "true"
   */
  showOpenButton: string;

  /**
   * Additional CSS class name(s) to apply to the embed wrapper element.
   */
  className: string;
}

/**
 * Converts a public Figma file or prototype URL into a valid embed URL
 * for use in the Figma iframe embed API.
 *
 * @remarks
 * Figma's embed API accepts any public file or prototype URL passed as the
 * `url` query parameter to `https://www.figma.com/embed`. Both `figma.com/file`
 * and `figma.com/proto` URLs are supported. The file must be publicly shared
 * in Figma ("Anyone with the link can view") for the embed to render.
 *
 * @param urlStr - The raw Figma URL pasted by the user.
 * @returns A valid Figma embed URL, or `null` if the input is not a Figma URL.
 */
const getFigmaEmbedUrl = (urlStr: string): string | null => {
  if (!urlStr) return null;
  const trimmed = urlStr.trim();

  try {
    const url = new URL(trimmed);
    if (!url.hostname.includes('figma.com')) return null;

    // Must be a file or prototype URL
    const isValid = url.pathname.includes('/file/') ||
                    url.pathname.includes('/proto/') ||
                    url.pathname.includes('/design/');
    if (!isValid) return null;

    return `https://www.figma.com/embed?embed_host=codefolio&url=${encodeURIComponent(trimmed)}`;
  } catch {
    return null;
  }
};

/**
 * Renders a Figma file or prototype as an interactive inline embed.
 *
 * @remarks
 * Uses Figma's official iframe embed API. The file must be set to public
 * ("Anyone with the link can view") in Figma's share settings for the embed
 * to render correctly. Supports both design files and clickable prototypes.
 *
 * Renders a static placeholder until the iframe has fully loaded to avoid
 * layout shift. If the embed is blocked by the user's browser or Figma's
 * permissions, an "Open in Figma" fallback link is shown.
 *
 * @example
 * ```tsx
 * <FigmaEmbed data={{ url: "https://www.figma.com/file/abc123/My-Design", height: "600" }} />
 * ```
 */
export const FigmaEmbed: React.FC<{ data: FigmaEmbedData }> = ({ data }) => {
  const { url, height = '600', showOpenButton = 'true', className } = data;
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const embedUrl = getFigmaEmbedUrl(url);

  if (!url) {
    return (
      <div className={`cf-figma cf-figma--empty ${className ?? ''}`}>
        <i className="fab fa-figma" />
        <span>Paste a Figma file or prototype URL</span>
        <p>Make sure the file is set to "Anyone with the link can view" in Figma</p>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className={`cf-figma cf-figma--error ${className ?? ''}`}>
        <i className="fab fa-figma" />
        <span>Invalid Figma URL</span>
        <p>Must be a figma.com/file, figma.com/design or figma.com/proto URL</p>
      </div>
    );
  }

  return (
    <div
      className={`cf-figma ${className ?? ''}`}
      style={{ height: `${height}px` }}
    >
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="cf-figma__skeleton">
          <div className="cf-figma__skeleton-pulse" />
          <div className="cf-figma__skeleton-label">
            <i className="fab fa-figma" /> Loading Figma embed...
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="cf-figma__blocked">
          <i className="fab fa-figma" />
          <span>Embed blocked or file is private</span>
          <p>Make sure the Figma file is publicly shared</p>
          {showOpenButton === 'true' && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="cf-figma__open-btn"
            >
              <i className="fab fa-figma" /> Open in Figma
            </a>
          )}
        </div>
      )}

      {/* Iframe */}
      {!hasError && (
        <iframe
          className={`cf-figma__iframe ${isLoaded ? 'is-loaded' : ''}`}
          src={embedUrl}
          allowFullScreen
          title="Figma embed"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}

      {/* Always-visible open button */}
      {isLoaded && showOpenButton === 'true' && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="cf-figma__open-pill"
        >
          <i className="fab fa-figma" /> Open in Figma
        </a>
      )}
    </div>
  );
};

registerComponent({
  name: "FigmaEmbed",
  defaults: {
    url: '',
    height: '600',
    showOpenButton: 'true',
    className: '',
  },
  fields: {
    url:            { type: 'text',    label: 'Figma URL' },
    height:         { type: 'text',    label: 'Height (px)' },
    showOpenButton: { type: 'boolean', label: 'Show "Open in Figma" Button' },
    className:      { type: 'text',    label: 'Class Name' },
  },
  component: FigmaEmbed as any,
  isCmsEditor: true,
  category: 'Integrations',
  icon: 'fab fa-figma',
});