import React, { useState } from "react";
import { registerComponent } from "../registry";
import './style.scss';

/**
 * Configuration data for the Accordion component.
 */
export interface AccordionData {
  /**
   * Whether multiple accordion items can be open simultaneously.
   * Accepts `"true"` or `"false"` as a string.
   * @default "false"
   */
  allowMultiple: string;

  /**
   * Additional CSS class name(s) to apply to the accordion wrapper element.
   */
  className: string;
}

/**
 * Accordion component that renders a collapsible list of child items.
 *
 * Child elements receive `isOpen` and `onToggle` props injected automatically,
 * so they should be compatible accordion item components.
 *
 * @example
 * ```tsx
 * <Accordion data={{ allowMultiple: "true", className: "my-accordion" }}>
 *   <AccordionItem title="Section 1">Content 1</AccordionItem>
 *   <AccordionItem title="Section 2">Content 2</AccordionItem>
 * </Accordion>
 * ```
 */
export const Accordion: React.FC<{ data: AccordionData; children?: React.ReactNode }> = ({ data, children }) => {
  const { allowMultiple = "false", className } = data;

  /** Tracks the indices of currently open accordion items. */
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  /**
   * Toggles the open/closed state of an accordion item by index.
   * If `allowMultiple` is not `"true"`, all other open items are closed first.
   *
   * @param idx - The zero-based index of the accordion item to toggle.
   */
  const toggle = (idx: number) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        if (allowMultiple !== "true") next.clear();
        next.add(idx);
      }
      return next;
    });
  };

  const items = React.Children.toArray(children);

  return (
    <div className={`cf-accordion ${className}`}>
      {items.map((child, idx) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as React.ReactElement<any>, {
          key: idx,
          isOpen: openIds.has(idx),
          onToggle: () => toggle(idx),
        });
      })}
    </div>
  );
};

registerComponent({
  name: "Accordion",
  defaults: {
    allowMultiple: "false",
    className: "",
  },
  component: Accordion as any,
  isCmsEditor: true,
  category: 'Accordion',
  icon: 'fas fa-list',
});