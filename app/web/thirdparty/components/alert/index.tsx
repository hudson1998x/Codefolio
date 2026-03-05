import React from "react";
import { registerComponent } from "../registry";
import './style.scss';

/**
 * The available alert variants, each with distinct iconography and colour treatment.
 *
 * - `info` — neutral informational note
 * - `success` — positive outcome or confirmation
 * - `warning` — caution, non-blocking issue
 * - `danger` — critical issue or destructive action notice
 * - `tip` — helpful suggestion or best practice
 */
const VARIANTS = ['info', 'success', 'warning', 'danger', 'tip'] as const;
export type AlertVariant = typeof VARIANTS[number];

/**
 * Maps each {@link AlertVariant} to a FontAwesome icon class.
 * Displayed to the left of the alert title.
 */
const VARIANT_ICONS: Record<AlertVariant, string> = {
  info:    'fas fa-info-circle',
  success: 'fas fa-check-circle',
  warning: 'fas fa-exclamation-triangle',
  danger:  'fas fa-times-circle',
  tip:     'fas fa-lightbulb',
};

/**
 * Maps each {@link AlertVariant} to a default title shown when no title is provided.
 */
const VARIANT_LABELS: Record<AlertVariant, string> = {
  info:    'Note',
  success: 'Success',
  warning: 'Warning',
  danger:  'Danger',
  tip:     'Tip',
};

export interface AlertData {
  /**
   * Controls the colour treatment, icon, and default title of the alert.
   * Falls back to `"info"` if an unrecognised value is provided.
   * @default "info"
   */
  variant: AlertVariant | string;

  /**
   * Heading text displayed in the alert header.
   * Defaults to the variant's label (e.g. `"Warning"`) when left empty.
   */
  title: string;

  /**
   * Body text rendered below the header. Omitted from the DOM when empty.
   */
  message: string;

  /**
   * Whether to display the variant icon to the left of the title.
   * Accepts `"true"` or `"false"` as a string.
   * @default "true"
   */
  showIcon: string;

  /**
   * Additional CSS class name(s) to apply to the alert wrapper element.
   */
  className: string;
}

/**
 * A styled callout / alert block for documentation and project pages.
 *
 * @remarks
 * Renders a coloured alert box with an optional icon, title, and message body.
 * Supports five semantic variants — info, success, warning, danger, and tip —
 * each with distinct colour treatment and iconography.
 *
 * Designed for use in project documentation sections to highlight important
 * notes, deprecation warnings, prerequisites, or helpful tips.
 *
 * @example
 * ```tsx
 * <Alert data={{ variant: "warning", title: "Deprecated", message: "Use v2 instead.", showIcon: "true" }} />
 * ```
 */
export const Alert: React.FC<{ data: AlertData }> = ({ data }) => {
  const {
    variant = 'info',
    title,
    message,
    showIcon = 'true',
    className,
  } = data;

  const safeVariant = VARIANTS.includes(variant as AlertVariant)
    ? variant as AlertVariant
    : 'info';

  const icon = VARIANT_ICONS[safeVariant];
  const defaultTitle = VARIANT_LABELS[safeVariant];
  const displayTitle = title || defaultTitle;

  return (
    <div className={`cf-alert cf-alert--${safeVariant} ${className ?? ''}`}>
      <div className="cf-alert__header">
        {showIcon === 'true' && (
          <i className={`${icon} cf-alert__icon`} />
        )}
        <span className="cf-alert__title">{displayTitle}</span>
      </div>
      {message && (
        <p className="cf-alert__message">{message}</p>
      )}
    </div>
  );
};

registerComponent({
  name: "Alert",
  defaults: {
    variant: 'info',
    title: '',
    message: 'Your message here.',
    showIcon: 'true',
    className: '',
  },
  fields: {
    variant:  { type: 'select',  label: 'Variant', options: [...VARIANTS] },
    title:    { type: 'text',    label: 'Title (optional — defaults to variant name)' },
    message:  { type: 'textarea',label: 'Message' },
    showIcon: { type: 'boolean', label: 'Show Icon' },
    className:{ type: 'text',    label: 'Class Name' },
  },
  component: Alert as any,
  isCmsEditor: true,
  category: 'Documentation',
  icon: 'fas fa-exclamation-circle',
});