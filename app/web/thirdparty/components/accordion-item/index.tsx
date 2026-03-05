import React, { useState } from "react";
import { registerComponent } from "../registry";
import './style.scss';

export interface AccordionItemData {
  label: string;
  className: string;
}

export const AccordionItem: React.FC<{
  data: AccordionItemData;
  children?: React.ReactNode;
}> = ({ data, children }) => {
  const { label, className } = data;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`cf-accordion-item ${isOpen ? 'is-open' : ''} ${className ?? ''}`}>
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