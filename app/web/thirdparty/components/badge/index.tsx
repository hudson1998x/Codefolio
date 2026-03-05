import React from "react";
import { registerComponent } from "../registry";
import './style.scss';

/**
 * The available badge colour variants.
 *
 * - `default` — neutral grey, for generic labels
 * - `blue` — informational, version numbers
 * - `green` — positive status, stable, live
 * - `yellow` — caution, beta, experimental
 * - `red` — danger, deprecated, breaking
 * - `purple` — special, new, highlight
 * - `orange` — warning, alpha
 */
const VARIANTS = ['default', 'blue', 'green', 'yellow', 'red', 'purple', 'orange'] as const;
export type BadgeVariant = typeof VARIANTS[number];

/**
 * Badge size presets.
 */
const SIZES = ['sm', 'md', 'lg'] as const;
export type BadgeSize = typeof SIZES[number];

export interface BadgeData {
  label: string;
  variant: BadgeVariant | string;
  size: BadgeSize | string;
  icon: string;
  href: string;
  className: string;
}

/**
 * A compact inline badge or tag for labelling content.
 *
 * @remarks
 * Renders a pill-shaped label with optional icon and link. Designed for
 * version numbers (`v2.3.0`), status labels (`deprecated`, `beta`, `stable`),
 * tech stack tags (`React`, `TypeScript`), licence labels (`MIT`), and any
 * other short metadata that needs visual emphasis inline or in a group.
 *
 * When `href` is provided the badge renders as an `<a>` tag with hover
 * treatment. Without `href` it renders as a plain `<span>`.
 *
 * @example
 * ```tsx
 * <Badge data={{ label: "v2.3.0", variant: "blue", icon: "fas fa-tag" }} />
 * <Badge data={{ label: "Deprecated", variant: "red", icon: "fas fa-times" }} />
 * <Badge data={{ label: "MIT License", variant: "green" }} />
 * ```
 */
export const Badge: React.FC<{ data: BadgeData }> = ({ data }) => {
  const { label, variant = 'default', size = 'md', icon, href, className } = data;

  const safeVariant = VARIANTS.includes(variant as BadgeVariant) ? variant : 'default';
  const safeSize = SIZES.includes(size as BadgeSize) ? size : 'md';

  const content = (
    <>
      {icon && <i className={`${icon} cf-badge__icon`} />}
      <span>{label || 'Badge'}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`cf-badge cf-badge--${safeVariant} cf-badge--${safeSize} cf-badge--link ${className ?? ''}`}
      >
        {content}
      </a>
    );
  }

  return (
    <span className={`cf-badge cf-badge--${safeVariant} cf-badge--${safeSize} ${className ?? ''}`}>
      {content}
    </span>
  );
};

registerComponent({
  name: "Badge",
  defaults: {
    label: 'v1.0.0',
    variant: 'blue',
    size: 'md',
    icon: '',
    href: '',
    className: '',
  },
  fields: {
    label:     { type: 'text',   label: 'Label' },
    variant:   { type: 'select', label: 'Colour', options: [...VARIANTS] },
    size:      { type: 'select', label: 'Size', options: [...SIZES] },
    icon:      { type: 'text',   label: 'Icon (FontAwesome class, optional)' },
    href:      { type: 'text',   label: 'Link URL (optional)' },
    className: { type: 'text',   label: 'Class Name' },
  },
  component: Badge as any,
  isCmsEditor: true,
  category: 'Documentation',
  icon: 'fas fa-tag',
});