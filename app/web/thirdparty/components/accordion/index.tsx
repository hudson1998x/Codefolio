import React, { useState } from "react";
import { registerComponent } from "../registry";
import './style.scss';

export interface AccordionData {
  allowMultiple: string;
  className: string;
}

export const Accordion: React.FC<{ data: AccordionData; children?: React.ReactNode }> = ({ data, children }) => {
  const { allowMultiple = "false", className } = data;
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

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