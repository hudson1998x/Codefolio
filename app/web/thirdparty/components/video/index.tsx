import React from "react";
import { registerComponent, CodefolioProps } from "../registry";
import './style.scss';

/**
 * Data shape for Canvas/CMS usage.
 */
export interface VideoData {
  /** The source URL of the video file (mp4, webm, etc). */
  src: string;
  /** Optional thumbnail image shown before play. */
  poster: string;
  /** Whether to show native player controls. @defaultValue `true` */
  controls: boolean;
  /** Whether to start playing automatically. @defaultValue `false` */
  autoPlay: boolean;
  /** Whether to restart from the beginning when finished. @defaultValue `false` */
  loop: boolean;
  /** Whether the audio is silenced by default. @defaultValue `false` */
  muted: boolean;
  /** Browser hint for loading the video data. @defaultValue `"metadata"` */
  preload: "none" | "metadata" | "auto";
  /** Optional extra class names. */
  className: string;
}

/**
 * Props for direct usage.
 */
export interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  // Add custom props here if needed in the future
}

/**
 * A standard HTML5 Video component with BEM styling.
 */
export const Video: React.FC<VideoProps> = ({
  src,
  poster,
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
  preload = "metadata",
  className,
  children,
  ...rest
}) => {
  const classes = [
    "cf-video",
    className,
  ].filter(Boolean).join(" ");

  return (
    <video
      src={src}
      poster={poster}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      preload={preload}
      className={classes}
      playsInline // Better support for autoPlay on mobile
      {...rest}
    >
      {children}
      Your browser does not support the video tag.
    </video>
  );
};

/**
 * Canvas adapter for CMS usage.
 * @internal
 */
const VideoCanvas: React.FC<CodefolioProps<VideoData>> = ({ data }) => {
  const { 
    src, 
    poster, 
    controls, 
    autoPlay, 
    loop, 
    muted, 
    preload, 
    className 
  } = data;

  return (
    <Video
      src={src}
      poster={poster}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      preload={preload}
      className={className}
    />
  );
};

registerComponent({
  name: "Video",
  defaults: {
    src: "",
    poster: "",
    controls: true,
    autoPlay: false,
    loop: false,
    muted: false,
    preload: "metadata",
    className: "",
  },
  component: VideoCanvas,
  isCmsEditor: true,
  category: 'Media'
});