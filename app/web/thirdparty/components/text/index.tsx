import React from "react";
import { registerComponent, CodefolioProps } from "../registry";
import "./style.scss";

/**
 * Configuration data for the Typography component.
 */
export interface TypographyData {
  /**
   * The text content to render inside the element.
   * @default "New Text Block"
   */
  content: string;

  /**
   * The HTML tag to render. Falls back to `"p"` if an unrecognised value is provided.
   * @default "p"
   */
  tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

  /**
   * Text alignment, mapped directly to the CSS `text-align` property.
   * @default "left"
   */
  align: "left" | "center" | "right" | "justify";

  /**
   * Font weight, applied as a BEM modifier class (`weight-${weight}`).
   * Actual weight values are defined in the companion SCSS.
   * @default "regular"
   */
  weight: "light" | "regular" | "medium" | "semibold" | "bold" | "black";

  /**
   * Inline `color` override. Leave empty to inherit from CSS.
   */
  color: string;

  /**
   * Inline `font-size` override (e.g. `"1.5rem"`, `"24px"`). Leave empty to inherit from CSS.
   */
  fontSize: string;

  /**
   * Inline `font-family` override (e.g. `"Inter, sans-serif"`). Leave empty to inherit from CSS.
   */
  fontFamily: string;

  /**
   * Inline `line-height` override (e.g. `"1.5"`). Leave empty to inherit from CSS.
   */
  lineHeight: string;

  /**
   * Inline `letter-spacing` override (e.g. `"0.05em"`). Leave empty to inherit from CSS.
   */
  letterSpacing: string;

  /**
   * Inline `margin-bottom` override (e.g. `"1rem"`). Leave empty to inherit from CSS.
   */
  marginBottom: string;

  /**
   * Additional CSS class name(s) to apply to the rendered element.
   */
  className: string;
}

/**
 * A flexible text primitive that renders any block or inline HTML text element
 * with full typographic control via props or inline style overrides.
 *
 * @remarks
 * Inline style props (`color`, `fontSize`, `fontFamily`, etc.) override CSS defaults
 * only when non-empty, allowing the companion SCSS presets to take precedence when
 * fields are left blank. The `tag` prop is validated against an allowlist and falls
 * back to `"p"` to prevent arbitrary element injection.
 *
 * @example
 * ```tsx
 * <Typography data={{ content: "Hello world", tag: "h2", align: "center", weight: "bold" }} />
 * ```
 */
const Typography: React.FC<CodefolioProps<TypographyData>> = ({ data }) => {
  const {
    content = "Type something...",
    tag = "p",
    align = "left",
    weight = "regular",
    color,
    fontSize,
    fontFamily,
    lineHeight,
    letterSpacing,
    marginBottom,
    className = "",
  } = data;

  const validTags = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "i", "b"];
  const safeTag = tag && validTags.includes(tag.toLowerCase()) 
    ? (tag.toLowerCase() as any) 
    : "p";

  const inlineStyles: React.CSSProperties = {
    color: color || undefined,
    fontSize: fontSize || undefined,
    fontFamily: fontFamily || undefined,
    lineHeight: lineHeight || undefined,
    letterSpacing: letterSpacing || undefined,
    marginBottom: marginBottom || undefined,
    textAlign: align,
  };

  return React.createElement(
    safeTag,
    {
      className: `cf-typography weight-${weight} tag-${safeTag} ${className}`.trim(),
      style: inlineStyles
    },
    content
  );
};

(Typography as any).isCmsEditor = true;
(Typography as any).category = "Content";
(Typography as any).icon = "fas fa-font";

registerComponent({
  name: "Text",
  defaults: {
    content: "New Text Block",
    tag: "p",
    align: "left",
    weight: "regular",
    // Leaving these empty by default allows the CSS presets to take over
    color: "",
    fontSize: "", 
    fontFamily: "Inter, sans-serif",
    lineHeight: "",
    letterSpacing: "",
    marginBottom: "",
    className: "",
  },
  component: Typography as React.FC<any>,
  isCmsEditor: true,
  category: 'Basic'
});

export { Typography };