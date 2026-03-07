import React from "react";
import { registerComponent, CodefolioProps } from "../registry";
import './style.scss';

/**
 * The visual/semantic style of the list.
 *
 * - `"unordered"`   — bullet list (`<ul>`)
 * - `"ordered"`     — numbered list (`<ol>`)
 * - `"none"`        — unstyled list (`<ul>` with no bullets), useful for nav/menu lists
 * - `"description"` — term/detail pairs (`<dl>`)
 * - `"inline"`      — items laid out horizontally (`<ul>` with flex row)
 */
export type ListVariant = "unordered" | "ordered" | "none" | "description" | "inline";

/**
 * Configuration data for the List component.
 */
export interface ListData {
  /**
   * Optional heading rendered above the list.
   * Omitted from the DOM when empty.
   */
  title: string;

  /**
   * Visual / semantic variant of the list.
   * @default "unordered"
   */
  variant: ListVariant;

  /**
   * Marker/counter style forwarded to the underlying `<ol>` or `<ul>` element
   * via the CSS `list-style-type` property.
   *
   * Examples: `"disc"`, `"circle"`, `"square"`, `"decimal"`, `"lower-alpha"`,
   * `"lower-roman"`, `"none"`.
   *
   * Omitting this prop leaves the browser/CSS default in effect.
   */
  markerStyle?: React.CSSProperties["listStyleType"];

  /**
   * When `true` a thin divider line is drawn between items.
   * @default false
   */
  divided: boolean;

  /**
   * Additional CSS class name(s) applied to the outermost wrapper element.
   */
  className: string;
}

/**
 * A general-purpose list wrapper that renders the correct semantic list element
 * based on `variant`. All content is passed via `children` — typically `<li>`,
 * `<dt>`, and `<dd>` elements, but any valid React nodes are accepted.
 *
 * @example
 * ```tsx
 * <List variant="ordered" divided>
 *   <li>Install dependencies</li>
 *   <li>Run the dev server</li>
 *   <li>Open localhost:3000</li>
 * </List>
 * ```
 */
export const List: React.FC<ListData & { children?: React.ReactNode }> = ({
  title,
  variant = "unordered",
  markerStyle,
  divided,
  className,
  children,
}) => {
  const wrapperClass = [
    "cf-list",
    `cf-list--${variant}`,
    divided ? "cf-list--divided" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const listStyle: React.CSSProperties = markerStyle
    ? { listStyleType: markerStyle }
    : {};

  const renderList = () => {
    if (variant === "description") {
      return <dl className="cf-list__dl">{children}</dl>;
    }
    if (variant === "ordered") {
      return <ol className="cf-list__ol" style={listStyle}>{children}</ol>;
    }
    return <ul className="cf-list__ul" style={listStyle}>{children}</ul>;
  };

  return (
    <div className={wrapperClass}>
      {title && <p className="cf-list__title">{title}</p>}
      {renderList()}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

registerComponent({
  name: "List",
  defaults: {
    title: "",
    variant: "unordered",
    divided: false,
    className: "",
  },
  component: List as any,
  isCmsEditor: true,
});

/**
 * Configuration data for the ListItem component.
 */
export interface ListItemData {
  /**
   * Additional CSS class name(s) applied to the `<li>` element.
   */
  className: string;
}

/**
 * A simple `<li>` wrapper. Drop it inside a `<List>` and pass any content as children.
 *
 * @example
 * ```tsx
 * <List variant="unordered">
 *   <ListItem>Hello world</ListItem>
 *   <ListItem>Another item</ListItem>
 * </List>
 * ```
 */
export const ListItem: React.FC<ListItemData & { children?: React.ReactNode }> = ({
  className,
  children,
}) => (
  <li className={`cf-list__item${className ? ` ${className}` : ""}`}>
    {children}
  </li>
);

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

registerComponent({
  name: "ListItem",
  defaults: {
    className: "",
  },
  component: ListItem as any,
  isCmsEditor: true,
});