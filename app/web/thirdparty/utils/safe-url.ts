/**
 * Returns a URL that is safe to use in environments where the app
 * may be hosted under a subdirectory (such as GitHub Pages).
 *
 * On GitHub Pages:
 *   /about -> /Codefolio/about
 *
 * On normal hosting:
 *   /about -> /about
 *
 * Absolute URLs are passed through unchanged:
 *   https://example.com -> https://example.com
 *
 * This ensures links, assets, and navigation work consistently
 * across local dev, root-domain hosting, and GitHub Pages.
 *
 * @param url The application-relative URL
 * @returns A deployment-safe URL
 */
export const getSafeUrl = (url: string): string => {

  // Allow absolute URLs (http, https, protocol-relative, mailto, etc.)
  if (/^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith("mailto:") || url.startsWith("tel:")) {
    return url;
  }

  const clean = url.startsWith("/") ? url : `/${url}`;

  if (window.location.hostname.endsWith("github.io")) {
    const repo = window.location.pathname.split("/")[1];

    // Avoid double prefixing
    if (clean.startsWith(`/${repo}/`)) return clean;

    return `/${repo}${clean}`;
  }

  return clean;
};

export const doesUrlStartWith = (url: string, prefix: string): boolean => {
  if (window.location.hostname.endsWith("github.io")) {
    const repo = window.location.pathname.split("/")[1];
    const fullPrefix = `/${repo}/${prefix.replace(/^\//, "")}`;
    return url.startsWith(fullPrefix) || url.startsWith(prefix);
  }

  return url.startsWith(prefix);
};