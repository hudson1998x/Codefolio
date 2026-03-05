export type ThemeSemVer = {
  major: number;
  minor: number;
  patch: number;
};

/**
 * Compares two semantic versions.
 * Returns:
 *   1 if a > b
 *   -1 if a < b
 *   0 if equal
 */
export const compareSemVer = (a: ThemeSemVer, b: ThemeSemVer): number => {
  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;
  return 0;
};

/**
 * Checks if a theme is compatible with a given app version.
 */
export const isThemeCompatible = (
  theme: ThemeData,
  appVersion: ThemeSemVer
): boolean => {
  const minOk = theme.minAppVersion
    ? compareSemVer(appVersion, theme.minAppVersion) >= 0
    : true;
  const maxOk = theme.maxAppVersion
    ? compareSemVer(appVersion, theme.maxAppVersion) <= 0
    : true;
  return minOk && maxOk;
};

/**
 * Returns a human-readable version string.
 */
export const semVerToString = (v: ThemeSemVer): string =>
  `${v.major}.${v.minor}.${v.patch}`;

export type ThemeData = {
  /** The theme name */
  name: string;

  /** the directory */
  key: string;

  /** Vendor or author of the theme */
  vendor: string;

  /** The theme version */
  version: ThemeSemVer;

  /** Optional human-readable description */
  description?: string;

  /** Optional URL to preview image or screenshot */
  previewImage?: string;

  /** Minimum compatible app version */
  minAppVersion?: ThemeSemVer;

  /** Maximum compatible app version */
  maxAppVersion?: ThemeSemVer;

  /** License type (MIT, GPL, Proprietary, etc.) */
  license?: string;

  /** Optional homepage / vendor page */
  homepage?: string;

  /** Optional default color palette for the theme */
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
  };

  /** Optional list of font families used by the theme */
  fonts?: string[];

  /** Optional feature flags supported by the theme */
  features?: {
    darkMode?: boolean;
    responsive?: boolean;
    customFonts?: boolean;
    [key: string]: boolean | undefined;
  };
};