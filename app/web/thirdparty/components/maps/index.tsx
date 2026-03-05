import React from "react";
import { registerComponent } from "../registry";
import './style.scss';

export interface GoogleMapsData {
  /**
   * The place name or address to display on the map
   * (e.g. `"London, UK"` or `"10 Downing Street, London"`).
   */
  location: string;

  /**
   * Google Maps Embed API key. Must have the Maps Embed API enabled
   * in the Google Cloud Console. Required — renders an error state when absent.
   */
  apiKey: string;

  /**
   * CSS `aspect-ratio` value applied to the map wrapper (e.g. `"16/9"`, `"4/3"`, `"1/1"`).
   * @default "16/9"
   */
  aspectRatio: string;

  /**
   * Initial zoom level passed to the Maps Embed API (0–21, where 0 is world view).
   * @default "14"
   */
  zoom: string;

  /**
   * Additional CSS class name(s) to apply to the map wrapper element.
   */
  className: string;
}

export const GoogleMaps: React.FC<{ data: GoogleMapsData }> = ({ data }) => {
  const { location, apiKey, aspectRatio = "16/9", zoom = "14", className } = data;

  if (!location || !apiKey) {
    return (
      <div className={`cf-maps cf-maps--error ${className}`} style={{ aspectRatio }}>
        <span>{!apiKey ? "API key required" : "Please enter a location"}</span>
      </div>
    );
  }

  const src = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(location)}&zoom=${zoom}`;

  return (
    <div className={`cf-maps ${className}`} style={{ aspectRatio }}>
      <iframe
        className="cf-maps__iframe"
        src={src}
        title="Google Maps"
        allowFullScreen={true}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        frameBorder="0"
      />
    </div>
  );
};

registerComponent({
  name: "GoogleMaps",
  defaults: {
    location: "London, UK",
    apiKey: "",
    aspectRatio: "16/9",
    zoom: "14",
    className: "",
  },
  component: GoogleMaps as any,
  isCmsEditor: true,
  category: 'Media',
  icon: 'fas fa-map-marker-alt',
});