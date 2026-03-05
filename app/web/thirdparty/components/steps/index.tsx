import React from "react";
import { registerComponent } from "../registry";
import './style.scss';

/**
 * A single step entry within a {@link StepList}.
 */
export interface Step {
  /** The step title shown in bold next to the indicator. */
  title: string;
  /** The step description shown below the title. */
  description: string;
  /** Whether this step is marked as completed — renders a checkmark instead of a circle. */
  completed?: boolean;
}

export interface StepListData {
  steps: string; // JSON string of Step[]
  className: string;
}

/**
 * Default steps shown when no data has been authored yet.
 * Gives the user a realistic preview out of the box.
 */
const DEFAULT_STEPS: Step[] = [
  { title: "Install dependencies", description: "Run `npm install` to install all required packages.", completed: true },
  { title: "Configure environment", description: "Copy `.env.example` to `.env` and fill in your values.", completed: true },
  { title: "Start the dev server", description: "Run `npm run dev` and open http://localhost:3000.", completed: false },
];

/**
 * A vertical numbered step guide component for documentation and project pages.
 *
 * @remarks
 * Renders a vertical list of steps connected by a line, each with a circular
 * indicator (checkmark when completed, outlined circle when pending), a bold
 * title, and a description. Steps are stored as a JSON array in the `steps`
 * prop, edited via the JSON field type in the properties pane.
 *
 * Designed for installation guides, getting started flows, setup instructions,
 * and any sequential process documentation.
 *
 * @example
 * ```tsx
 * <StepList data={{ steps: JSON.stringify([
 *   { title: "Clone the repo", description: "git clone ...", completed: true },
 *   { title: "Install deps", description: "npm install", completed: false },
 * ]) }} />
 * ```
 */
export const StepList: React.FC<{ data: StepListData }> = ({ data }) => {
  const { steps: stepsRaw, className } = data;

  const steps: Step[] = (() => {
    try {
      const parsed = JSON.parse(stepsRaw);
      return Array.isArray(parsed) ? parsed : DEFAULT_STEPS;
    } catch {
      return DEFAULT_STEPS;
    }
  })();

  return (
    <div className={`cf-steps ${className ?? ''}`}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const isCompleted = step.completed === true;

        return (
          <div key={idx} className={`cf-steps__item ${isCompleted ? 'is-completed' : ''} ${isLast ? 'is-last' : ''}`}>

            {/* Left column: indicator + connector line */}
            <div className="cf-steps__left">
              <div className="cf-steps__indicator">
                {isCompleted
                  ? <i className="fas fa-check" />
                  : <span className="cf-steps__dot" />
                }
              </div>
              {!isLast && <div className="cf-steps__line" />}
            </div>

            {/* Right column: content */}
            <div className="cf-steps__content">
              <div className="cf-steps__title">{step.title}</div>
              {step.description && (
                <p className="cf-steps__description">{step.description}</p>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};

registerComponent({
  name: "StepList",
  defaults: {
    steps: JSON.stringify(DEFAULT_STEPS, null, 2),
    className: '',
  },
  fields: {
    steps:     { type: 'json', label: 'Steps (JSON)' },
    className: { type: 'text', label: 'Class Name' },
  },
  component: StepList as any,
  isCmsEditor: true,
  category: 'Documentation',
  icon: 'fas fa-list-ol',
});