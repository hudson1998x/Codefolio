import React, { useRef } from "react";
import { registerComponent, CodefolioProps } from "../registry";
import './style.scss'

export const CarouselList: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'prev' | 'next') => {
    if (scrollRef.current) {
      const { current: el } = scrollRef;
      // Find the width of the first child (the card) plus its gap
      const cardWidth = el.firstElementChild?.clientWidth || 300;
      const gap = 24; // Matches our SCSS gap
      
      el.scrollBy({
        left: direction === 'next' ? cardWidth + gap : -(cardWidth + gap),
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="cf-carousel">
      <div className="cf-carousel__controls">
        <button type='button' onClick={() => scroll('prev')} className="cf-carousel__btn">{"<"}</button>
        <button type='button' onClick={() => scroll('next')} className="cf-carousel__btn">{">"}</button>
      </div>
      <div className="cf-carousel__viewport" ref={scrollRef}>
        {children}
      </div>
    </div>
  );
};

registerComponent({
  name: "CarouselList",
  defaults: {},
  component: CarouselList as any,
  isCmsEditor: true,
  category: 'Structure'
});