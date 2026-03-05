import React from "react";
import { registerComponent } from "../registry";
import './style.scss';

/**
 * The available divider styles.
 *
 * - `line` — a simple solid horizontal rule
 * - `dashed` — a dashed horizontal rule
 * - `dotted` — a dotted horizontal rule
 * - `spacer` — invisible, purely adds vertical space with no visual element
 */
const VARIANTS = ['line', 'dashed', 'dotted', 'spacer'] as const;
export type DividerVariant = typeof VARIANTS[number];

/**
 * Vertical spacing presets applied above and below the divider.
 * Maps to fixed rem values in SCSS.
 */
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export type DividerSize = typeof SIZES[number];

export interface DividerData {
  variant: DividerVariant | string;
  size: DividerSize | string;
  label: string;
  className: string;
}

/**
 * A horizontal divider or invisible spacer for controlling vertical rhythm.
 *
 * @remarks
 * Supports four visual styles — solid line, dashed, dotted, and invisible
 * spacer — each with five size presets controlling the vertical padding.
 * An optional `label` renders centred text within the divider line, useful
 * for section breaks like "— Projects —" or "— Experience —".
 *
 * The `spacer` variant renders no visual element at all, purely adding
 * vertical breathing room between sections.
 *
 * @example
 * ```tsx
 * <Divider data={{ variant: "dashed", size: "lg", label: "Projects" }} />
 * ```
 */
export const Divider: React.FC<{ data: DividerData }> = ({ data }) => {
  const { variant = 'line', size = 'md', label, className } = data;

  const safeVariant = VARIANTS.includes(variant as DividerVariant) ? variant : 'line';
  const safeSize = SIZES.includes(size as DividerSize) ? size : 'md';

  if (safeVariant === 'spacer') {
    return <div className={`cf-divider cf-divider--spacer cf-divider--${safeSize} ${className ?? ''}`} />;
  }

  return (
    <div className={`cf-divider cf-divider--${safeVariant} cf-divider--${safeSize} ${className ?? ''}`}>
      {label ? (
        <span className="cf-divider__label">{label}</span>
      ) : null}
    </div>
  );
};

registerComponent({
  name: "Divider",
  defaults: {
    variant: 'line',
    size: 'md',
    label: '',
    className: '',
  },
  fields: {
    variant:   { type: 'select', label: 'Style', options: [...VARIANTS] },
    size:      { type: 'select', label: 'Spacing', options: [...SIZES] },
    label:     { type: 'text',   label: 'Label (optional)' },
    className: { type: 'text',   label: 'Class Name' },
  },
  component: Divider as any,
  isCmsEditor: true,
  category: 'Layout',
  icon: 'fas fa-minus',
});