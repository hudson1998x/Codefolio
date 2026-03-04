import React from "react";
import { registerComponent, CodefolioProps } from "../registry";

/**
 * The data shape stored in a {@link CanvasNode} when the `"section"`
 * component is used in a content tree.
 *
 * @example
 * ```json
 * {
 *   "component": "section",
 *   "data": {
 *     "title": "About Me",
 *     "subtitle": "A little bit about who I am",
 *     "align": "center",
 *     "background": "muted"
 *   },
 *   "children": []
 * }
 * ```
 */
export interface SectionData {
  /** Optional heading rendered at the top of the section. */
  title: string;
  /** Optional subheading rendered beneath the title. */
  subtitle: string;
  /**
   * Horizontal alignment applied as a BEM modifier class
   * `cf-section--align-{value}` on the root element.
   * @defaultValue `"left"`
   */
  align: "left" | "center" | "right";
  /**
   * Background treatment applied as a BEM modifier class
   * `cf-section--bg-{value}` on the root element.
   * @defaultValue `"none"`
   */
  background: "none" | "muted" | "accent";
  /** Optional extra class names applied to the section root element. */
  className: string;
}

/**
 * A full-width content section that wraps {@link CanvasNode} children with
 * optional title, subtitle, alignment, and background treatment.
 *
 * All visual variants are expressed purely as BEM modifier classes —
 * no inline styles or bundled CSS. The consuming theme is responsible for
 * styling the modifier classes.
 *
 * @remarks
 * `Section` is the primary layout primitive for composing page content.
 * Most pages should consist of one or more sections, each containing the
 * components relevant to that part of the page.
 *
 * Modifier classes follow the pattern:
 * - `cf-section--align-{left|center|right}`
 * - `cf-section--bg-{none|muted|accent}`
 *
 * @example
 * ```json
 * {
 *   "component": "section",
 *   "data": {
 *     "title": "My Work",
 *     "align": "center",
 *     "background": "muted"
 *   },
 *   "children": [
 *     { "component": "project-card", "data": {}, "children": [] }
 *   ]
 * }
 * ```
 */
const Section: React.FC<CodefolioProps<SectionData>> = ({ data, children }) => {
  const {
    title      = "",
    subtitle   = "",
    align      = "left",
    background = "none",
    className  = "",
  } = data;

  const classes = [
    "cf-section",
    `cf-section--align-${align}`,
    `cf-section--bg-${background}`,
    className,
  ].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      <div className="cf-section__inner">
        {(title || subtitle) && (
          <div className="cf-section__header">
            {title    && <h2 className="cf-section__title">{title}</h2>}
            {subtitle && <p  className="cf-section__subtitle">{subtitle}</p>}
          </div>
        )}

        <div className="cf-section__content">
          {children}
        </div>
      </div>
    </section>
  );
};

/**
 * Default {@link SectionData} payload used when a `"section"` node is
 * dropped onto the canvas from the page editor palette.
 */
const sectionDefaults: SectionData = {
  title:      "",
  subtitle:   "",
  align:      "left",
  background: "none",
  className:  "",
};

registerComponent({
  name:      "Section",
  defaults:  sectionDefaults,
  component: Section,
  isCmsEditor: true,
  category: 'Structure'
});