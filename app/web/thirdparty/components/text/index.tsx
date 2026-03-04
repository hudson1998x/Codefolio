import React from "react";
import { registerComponent, CodefolioProps } from "../registry";
import "./style.scss";

export interface TypographyData {
  content: string;
  tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  align: "left" | "center" | "right" | "justify";
  weight: "light" | "regular" | "medium" | "semibold" | "bold" | "black";
  color: string;
  fontSize: string;
  fontFamily: string;
  lineHeight: string;
  letterSpacing: string;
  marginBottom: string;
  className: string;
}

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