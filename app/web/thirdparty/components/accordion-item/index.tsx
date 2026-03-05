import React, { useState } from "react";
import { registerComponent } from "../registry";
import './style.scss';

/**
 * Configuration data for the AccordionItem component.
 */
export interface AccordionItemData {
  /**
   * The visible label text displayed in the accordion trigger button.
   * @default "Accordion Item"
   */
  label: string;

  /**
   * Additional CSS class name(s) to apply to the accordion item wrapper element.
   */
  className: string;
}

/**
 * A single collapsible item for use inside an {@link Accordion} component.
 *
 * Manages its own open/closed state internally, but also accepts `isOpen` and
 * `onToggle` props injected by a parent `Accordion` when coordinated behaviour
 * (e.g. closing siblings) is required.
 *
 * @example
 * ```tsx
 * <AccordionItem data={{ label: "What is your return policy?", className: "" }}>
 *   <p>You can return any item within 30 days of purchase.</p>
 * </AccordionItem>
 * ```
 */
export const AccordionItem: React.FC<{
  data: AccordionItemData;
  children?: React.ReactNode;
}> = ({ data, children }) => {
  const { label, className } = data;

  /** Tracks whether this item's content panel is currently expanded. */
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`cf-accordion-item ${isOpen ? 'is-open' : ''} ${className ?? ''}`}>
      {/*
       * Trigger button toggles the open state on click.
       * Uses type="button" to prevent accidental form submission.
       */}
      <button type="button" className="cf-accordion-item__trigger" onClick={() => setIsOpen(prev => !prev)}>
        <span>{label || "Accordion Item"}</span>
        <i className="fas fa-chevron-down cf-accordion-item__icon" />
      </button>
      <div className="cf-accordion-item__body">
        <div className="cf-accordion-item__content">
          {children ?? <p>Add content inside this accordion item.</p>}
        </div>
      </div>
    </div>
  );
};

registerComponent({
  name: "AccordionItem",
  defaults: {
    label: "Accordion Item",
    className: "",
  },
  component: AccordionItem as any,
  isCmsEditor: true,
  category: 'Accordion',
  icon: 'fas fa-minus',
});