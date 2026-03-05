import React from "react";
import { registerComponent, CodefolioProps } from "../registry";
import './style.scss';

/**
 * Configuration data for the Card component.
 */
export interface CardData {
  /**
   * Primary heading displayed in the card body.
   * Omitted from the DOM when empty.
   */
  title: string;

  /**
   * Secondary heading displayed beneath the title.
   * Omitted from the DOM when empty.
   */
  subtitle: string;

  /**
   * URL of an image to render at the top of the card.
   * The card's `alt` text is derived from {@link CardData.title}.
   * Omitted from the DOM when not provided.
   */
  image?: string;

  /**
   * Whether to render the footer action area at the bottom of the card.
   * @default false
   */
  showFooter: boolean;

  /**
   * Additional CSS class name(s) to apply to the card wrapper element.
   */
  className: string;
}

/**
 * A general-purpose content card with an optional image, title, subtitle,
 * body slot, and footer action area.
 *
 * @example
 * ```tsx
 * <Card title="Getting Started" subtitle="A quick introduction" showFooter={true} className="">
 *   <p>Follow these steps to set up your project.</p>
 * </Card>
 * ```
 */
export const Card: React.FC<CardData & { children?: React.ReactNode }> = ({
  title,
  subtitle,
  image,
  showFooter,
  className,
  children
}) => {
  return (
    <div className={`cf-card ${className}`}>
      {image && <img src={image} className="cf-card__img" alt={title} />}
      <div className="cf-card__body">
        {title && <h3 className="cf-card__title">{title}</h3>}
        {subtitle && <h4 className="cf-card__subtitle">{subtitle}</h4>}
        <div className="cf-card__text">{children}</div>
      </div>
      {showFooter && <div className="cf-card__footer">Action Area</div>}
    </div>
  );
};

registerComponent({
  name: "Card",
  defaults: { title: "Card Title", subtitle: "Card Subtitle", showFooter: false, className: "" },
  component: Card as any,
  isCmsEditor: true,
});