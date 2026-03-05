import React from "react";
import { registerComponent, CodefolioProps } from "../registry";
import './style.scss';

export interface GridData {
  /** Space between items. @defaultValue `"md"` */
  gap: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /** Vertical alignment. @defaultValue `"stretch"` */
  align: "flex-start" | "center" | "flex-end" | "stretch";
  /** Horizontal distribution. @defaultValue `"flex-start"` */
  justify: "flex-start" | "center" | "flex-end" | "space-between";
  /** Whether columns wrap on mobile. @defaultValue `true` */
  wrap: boolean;
  className: string;
}

export const Grid: React.FC<GridData & { children?: React.ReactNode }> = ({
  gap = "md",
  align = "stretch",
  justify = "flex-start",
  wrap = true,
  className,
  children
}) => {
  const classes = [
    "cf-grid",
    `cf-grid--gap-${gap}`,
    `cf-grid--align-${align}`,
    `cf-grid--justify-${justify}`,
    wrap ? "cf-grid--wrap" : "",
    className
  ].filter(Boolean).join(" ");

  return <div className={classes}>{children}</div>;
};

const GridCanvas: React.FC<CodefolioProps<GridData>> = ({ data, children }) => (
  <Grid {...data}>{children}</Grid>
);

registerComponent({
  name: "Grid",
  defaults: { gap: "md", align: "stretch", justify: "flex-start", wrap: true, className: "" },
  component: GridCanvas,
  isCmsEditor: true,
  category: 'Layout'
});