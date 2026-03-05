import React, { useRef } from "react";
import { registerComponent, CodefolioProps } from "../registry";
import './style.scss'

/**
 * A horizontally scrollable carousel container with previous/next controls.
 *
 * Child elements are laid out in a scrollable row. The scroll distance per
 * button click is calculated from the width of the first child plus the gap
 * defined in the companion SCSS (`24px`), so each click advances by exactly
 * one card.
 *
 * @example
 * ```tsx
 * <CarouselList>
 *   <Card title="Item 1" />
 *   <Card title="Item 2" />
 *   <Card title="Item 3" />
 * </CarouselList>
 * ```
 */
export const CarouselList: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  /** Ref attached to the scrollable viewport used to drive programmatic scrolling. */
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Scrolls the carousel viewport by one card in the given direction.
   * Falls back to a `300px` scroll distance if the first child's width
   * cannot be determined.
   *
   * @param direction - `"prev"` to scroll left, `"next"` to scroll right.
   */
  const scroll = (direction: 'prev' | 'next') => {
    if (scrollRef.current) {
      const { current: el } = scrollRef;
      const cardWidth = el.firstElementChild?.clientWidth || 300;
      const gap = 24; // Matches the gap defined in the companion SCSS

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