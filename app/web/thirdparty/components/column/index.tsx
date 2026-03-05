import React from "react";
import { registerComponent, CodefolioProps } from "../registry";

export interface LinkData {
  /** Whether the link points to an internal page or an external URL. */
  linkType: 'internal' | 'external';
  /** The destination path (e.g. /page/1) or full URL (e.g. https://google.com). */
  url: string;
  /** The text to display inside the link. */
  text: string;
  /** Whether to open in the same tab or a new one. */
  target: '_self' | '_blank';
  /** Additional CSS class name(s). */
  className?: string;
}

export const Link: React.FC<LinkData & { children?: React.ReactNode }> = ({
  linkType = "internal",
  url = "/page/1",
  text = "Learn More",
  target = "_self",
  className,
  children
}) => {
  const classes = ["cf-link", className].filter(Boolean).join(" ");

  return (
    <a 
      href={url} 
      className={classes} 
      target={target}
      rel={target === '_blank' ? "noopener noreferrer" : undefined}
    >
      {text || children}
    </a>
  );
};

const LinkCanvas: React.FC<CodefolioProps<LinkData>> = ({ data, children }) => (
  <Link {...data}>{children}</Link>
);

registerComponent({
  name: "Anchor",
  defaults: { 
    linkType: "internal",
    url: "/page/1", 
    text: "Learn More", 
    target: "_self", 
    className: "" 
  },
  component: LinkCanvas,
  isCmsEditor: true,
  category: 'General',
  icon: 'fas fa-link',
  fields: {
    linkType: {
      label: 'Link Mode',
      type: 'select',
      options: ['internal', 'external']
    },
    url: { 
      label: 'Destination', 
      // We keep this as text by default, but our PropField will 
      // check 'linkType' to decide if it shows the Picker.
      type: 'page-picker' 
    },
    text: { label: 'Link Text', type: 'text' },
    target: { label: 'Open In', type: 'select', options: ['_self', '_blank'] },
    className: { label: 'Custom Class', type: 'text' }
  }
});