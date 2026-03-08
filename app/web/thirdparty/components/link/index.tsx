import React from "react";
import { registerComponent, CodefolioProps } from "../registry";
import './style.scss'
import { getSafeUrl } from "../../utils/safe-url";

export interface AnchorData {
  url: string;
  text: string;
  target: '_self' | '_blank';
  className?: string;
}

export const Anchor: React.FC<AnchorData & { children?: React.ReactNode }> = ({
  url = "/page/1",
  text = "Learn More",
  target = "_self",
  className,
  children
}) => {
  const isExternal = url.startsWith('http');
  const classes = ["cf-anchor", className].filter(Boolean).join(" ");

  return (
    <a 
      href={isExternal ? url : getSafeUrl(url)} 
      className={classes} 
      target={target}
      rel={isExternal || target === '_blank' ? "noopener noreferrer" : undefined}
    >
      {text || children}
    </a>
  );
};

const AnchorCanvas: React.FC<CodefolioProps<AnchorData>> = ({ data, children }) => (
  <Anchor {...data}>{children}</Anchor>
);

registerComponent({
  name: "Anchor",
  defaults: { 
    url: "/page/1", 
    text: "Learn More", 
    target: "_self", 
    className: "" 
  },
  component: AnchorCanvas,
  isCmsEditor: true,
  category: 'General',
  icon: 'fas fa-link',
  fields: {
    url: { 
      label: 'Link Destination', 
      type: 'page-picker'
    },
    text: { label: 'Display Text', type: 'text' },
    target: { label: 'Open In', type: 'select', options: ['_self', '_blank'] },
    className: { label: 'CSS Class', type: 'text' }
  }
});