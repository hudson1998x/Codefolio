import React from "react";
import { registerComponent } from "../registry";
import './style.scss';

export interface YouTubeData {
  url: string;
  aspectRatio: string;
  className: string;
}

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