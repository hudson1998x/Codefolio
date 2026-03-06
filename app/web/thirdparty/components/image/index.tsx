import React from "react";
import { registerComponent, CodefolioProps } from "../registry";
import './style.scss';
import { getSafeUrl } from "../../utils/safe-url";

/**
 * Fit strategy for the image, applied as `cf-img--{fit}`.
 */
export type ImageFit = "cover" | "contain" | "fill" | "none" | "scale-down";

/**
 * Data shape for Canvas/CMS usage.
 */
export interface ImageData {
  /** The source URL of the image. */
  src: string;
  /** Alt text for accessibility. */
  alt: string;
  /** Fit strategy. @defaultValue `"cover"` */
  fit: ImageFit;
  /** Whether to lazy load the image. @defaultValue `true` */
  lazy: boolean;
  /** Optional aspect ratio (e.g., "16/9"). */
  aspectRatio: string;
  /** Optional extra class names. */
  className: string;
}

/**
 * Props for direct usage.
 */
export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Fit strategy. @defaultValue `"cover"` */
  fit?: ImageFit;
  /** Aspect ratio CSS value. */
  aspectRatio?: string;
}

/**
 * A robust Image component with BEM styling and lazy-loading support.
 */
export const Image: React.FC<ImageProps> = ({
  src,
  alt = "",
  fit = "cover",
  aspectRatio,
  className,
  loading,
  ...rest
}) => {
  const classes = [
    "cf-img",
    `cf-img--${fit}`,
    className,
  ].filter(Boolean).join(" ");

  const style: React.CSSProperties = {
    aspectRatio: aspectRatio,
    ...rest.style,
  };

  return (
    <img
      src={getSafeUrl(src)}
      alt={alt}
      className={classes}
      loading={loading || "lazy"} // Default to lazy unless overridden
      style={style}
      {...rest}
    />
  );
};

/**
 * Canvas adapter for CMS usage.
 * @internal
 */
const ImageCanvas: React.FC<CodefolioProps<ImageData>> = ({ data }) => {
  const { src, alt, fit, lazy, aspectRatio, className } = data;

  return (
    <Image
      src={src}
      alt={alt}
      fit={fit}
      aspectRatio={aspectRatio}
      className={className}
      loading={lazy ? "lazy" : "eager"}
    />
  );
};

// image-component.tsx

registerComponent({
  name: "Image",
  category: 'Media',
  isCmsEditor: true,
  icon: "fas fa-image", // Optional FontAwesome icon
  defaults: {
    src: "https://via.placeholder.com/800x450?text=Select+Image",
    alt: "Placeholder Image",
    fit: "cover",
    lazy: true,
    aspectRatio: "auto",
    className: "",
  },
  // We explicitly map the 'src' field to our new 'image-picker'
  fields: {
    src: { type: 'image-uploader', label: 'Image Source' },
    fit: { 
      type: 'select', 
      options: ['cover', 'contain', 'fill', 'none', 'scale-down'],
      label: 'Object Fit'
    },
    aspectRatio: { type: 'text', label: 'Aspect Ratio (e.g. 16/9)' }
  },
  component: ImageCanvas,
});