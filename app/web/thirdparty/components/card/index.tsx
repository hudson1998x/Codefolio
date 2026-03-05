import React from "react";
import { registerComponent, CodefolioProps } from "../registry";
import './style.scss';

export interface CardData {
  title: string;
  subtitle: string;
  image?: string;
  showFooter: boolean;
  className: string;
}

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