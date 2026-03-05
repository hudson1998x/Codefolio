import React from "react";
import { registerComponent } from "../registry";
import './style.scss';

/**
 * Configuration data for the YouTube component.
 */
export interface YouTubeData {
  /**
   * Any valid YouTube video URL. Supports the following formats:
   * - Standard: `youtube.com/watch?v=ID`
   * - Short: `youtu.be/ID`
   * - Embed: `youtube.com/embed/ID`
   * - Shorts: `youtube.com/shorts/ID`
   *
   * Renders an error state if the URL is missing or unrecognised.
   */
  url: string;

  /**
   * CSS `aspect-ratio` value applied to the embed wrapper (e.g. `"16/9"`, `"4/3"`, `"1/1"`).
   * @default "16/9"
   */
  aspectRatio: string;

  /**
   * Additional CSS class name(s) to apply to the embed wrapper element.
   */
  className: string;
}

/**
 * Extracts the video ID from any recognised YouTube URL format.
 *
 * Supports standard watch URLs, short `youtu.be` links, embed paths,
 * Shorts, and legacy `/v/` paths.
 *
 * @param urlStr - The raw YouTube URL string to parse.
 * @returns The extracted video ID, or `null` if the URL is invalid or unrecognised.
 */
const getYouTubeID = (urlStr: string): string | null => {
  if (!urlStr) return null;

  try {
    const url = new URL(urlStr.trim());

    // Standard watch URL: youtube.com/watch?v=ID
    const v = url.searchParams.get("v");
    if (v) return v;

    // Short URL: youtu.be/ID
    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1) || null;
    }

    // Embed or shorts: youtube.com/embed/ID or youtube.com/shorts/ID
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex(p => p === "embed" || p === "shorts" || p === "v");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];

  } catch {
    return null;
  }

  return null;
};

/**
 * Renders a YouTube video as a privacy-enhanced iframe embed (`youtube-nocookie.com`).
 *
 * @remarks
 * Accepts any common YouTube URL format — the video ID is extracted automatically.
 * Renders a styled error state when the URL is absent or cannot be parsed.
 * Autoplay and related video suggestions are disabled by default via embed parameters.
 *
 * @example
 * ```tsx
 * <YouTube data={{ url: "https://youtu.be/dQw4w9WgXcQ", aspectRatio: "16/9", className: "" }} />
 * ```
 */
export const YouTube: React.FC<{ data: YouTubeData }> = ({ data }) => {
  const { url, aspectRatio = "16/9", className } = data;
  const videoId = getYouTubeID(url);

  if (!videoId) {
    return (
      <div className={`cf-youtube cf-youtube--error ${className}`} style={{ aspectRatio }}>
        <span>Please enter a valid YouTube URL</span>
      </div>
    );
  }

  return (
    <div className={`cf-youtube ${className}`} style={{ aspectRatio }}>
      <iframe
        className="cf-youtube__iframe"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&showinfo=0&autoplay=0`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen={true}
        frameBorder="0"
      />
    </div>
  );
};

registerComponent({
  name: "YouTube",
  defaults: {
    url: "",
    aspectRatio: "16/9",
    className: "",
  },
  component: YouTube as any,
  isCmsEditor: true,
  category: 'Media'
});