import React from "react";
import { registerComponent, CodefolioProps } from "../registry";
import './style.scss'

/**
 * Visual variant of the {@link Button} component, applied as a BEM
 * modifier class `cf-btn--{variant}` on the root element.
 */
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "link";

/**
 * Size of the {@link Button} component, applied as a BEM modifier class
 * `cf-btn--{size}` on the root element.
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * The data shape stored in a {@link CanvasNode} when the `"Button"`
 * component is used in a content tree.
 */
export interface ButtonData {
  /** Visual variant. @defaultValue `"primary"` */
  variant: ButtonVariant;
  /** Size modifier. @defaultValue `"md"` */
  size: ButtonSize;
  /** The button type attribute. @defaultValue `"button"` */
  type: "button" | "submit" | "reset";
  /** Whether the button is non-interactive. @defaultValue `false` */
  disabled: boolean;
  /** Optional extra class names applied to the root element. */
  className: string;
}

/**
 * Props for direct (non-canvas) usage of {@link Button}.
 * Extends the native `<button>` element props so all standard
 * button attributes and event handlers are available.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant. @defaultValue `"primary"` */
  variant?: ButtonVariant;
  /** Size modifier. @defaultValue `"md"` */
  size?: ButtonSize;
}

/**
 * A styled button component that wraps the native `<button>` element,
 * exposing variant and size modifiers as BEM class names.
 *
 * All standard `<button>` HTML attributes and event handlers are
 * forwarded via rest props, so `onClick`, `form`, `aria-*` and
 * anything else work as expected.
 *
 * Modifier classes follow the pattern:
 * - `cf-btn--primary` / `cf-btn--secondary` / `cf-btn--danger` / `cf-btn--ghost` / `cf-btn--link`
 * - `cf-btn--sm` / `cf-btn--md` / `cf-btn--lg`
 *
 * @example
 * ```tsx
 * // Direct usage
 * <Button variant="primary" size="md" onClick={handleSave}>Save Changes</Button>
 *
 * // Canvas usage
 * {
 *   "component": "Button",
 *   "data": { "variant": "primary", "size": "md", "type": "submit" },
 *   "children": [{ "component": "text", "data": { "textContent": "Save Changes" }, "children": [] }]
 * }
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  variant   = "primary",
  size      = "md",
  className,
  type      = "button",
  children,
  ...rest
}) => {
  const classes = [
    "cf-btn",
    `cf-btn--${variant}`,
    `cf-btn--${size}`,
    className,
  ].filter(Boolean).join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
};

/**
 * Canvas adapter that unwraps {@link CodefolioProps}<{@link ButtonData}>
 * and forwards to {@link Button}.
 * @internal
 */
const ButtonCanvas: React.FC<CodefolioProps<ButtonData>> = ({ data, children }) => {
  const { variant, size, type, disabled, className } = data;

  return (
    <Button
      variant={variant}
      size={size}
      type={type}
      disabled={disabled}
      className={className}
    >
      {children}
    </Button>
  );
};

registerComponent({
  name:     "Button",
  defaults: {
    variant:   "primary",
    size:      "md",
    type:      "button",
    disabled:  false,
    className: "",
  },
  component: ButtonCanvas,
  isCmsEditor: true,
  category: 'Forms'
});