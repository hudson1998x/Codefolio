import React from "react";
import { registerComponent } from "../registry";
import './style.scss';

export interface GoogleMapsData {
  location: string;
  apiKey: string;
  aspectRatio: string;
  zoom: string;
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