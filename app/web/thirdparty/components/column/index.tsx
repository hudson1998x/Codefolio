import React from "react";
import { registerComponent, CodefolioProps } from "../registry";

export interface ColumnData {
  /** Width on desktop (1-12 scale). @defaultValue `6` (50%) */
  span: number;
  /** Width on mobile. @defaultValue `12` (100%) */
  mobileSpan: number;
  className: string;
}

export const Column: React.FC<ColumnData & { children?: React.ReactNode }> = ({
  span = 6,
  mobileSpan = 12,
  className,
  children
}) => {
  const classes = [
    "cf-col",
    `cf-col--${span}`,
    `cf-col-m--${mobileSpan}`,
    className
  ].filter(Boolean).join(" ");

  return <div className={classes}>{children}</div>;
};

const ColumnCanvas: React.FC<CodefolioProps<ColumnData>> = ({ data, children }) => (
  <Column {...data}>{children}</Column>
);

registerComponent({
  name: "Column",
  defaults: { span: 6, mobileSpan: 12, className: "" },
  component: ColumnCanvas,
  isCmsEditor: true,
  category: 'Layout'
});