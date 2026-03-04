import React from "react";

/**
 * The standard props contract for every Codefolio component.
 *
 * All components registered via {@link registerComponent} receive these
 * props from the renderer when a {@link CanvasNode} is mounted. The `data`
 * field carries the node's authored payload, and `children` carries any
 * pre-rendered child nodes.
 *
 * @typeParam T - The shape of the component's `data` payload. Should match
 *               the `defaults` object passed to {@link registerComponent}.
 */
export interface CodefolioProps<T extends Record<string, any> = Record<string, any>> {
  /** The authored data payload for this node, merged with component defaults. */
  data: T;
  /** Pre-rendered child {@link CanvasNode} elements from the content tree. */
  children?: React.ReactNode;
}

/**
 * The full registration contract for a Codefolio component.
 *
 * @typeParam T - The shape of the component's `data` payload, inferred from
 *               the `defaults` object.
 *
 * @remarks
 * The `defaults` object is the single source of truth for a component's
 * data shape. It drives:
 * - The prop panel in the page editor (field types inferred from value shapes)
 * - Content scaffolding via `ContentService`
 * - The component palette (dropped onto canvas with defaults pre-filled)
 * - `useModuleConfig` fallback resolution
 */
export interface CodefolioComponent<T extends Record<string, any> = Record<string, any>> {
  /** The unique identifier used to reference this component in content JSON. */
  name: string;
  /**
   * Default data payload for this component. Must satisfy the full data
   * shape — every field the component expects should have a default value
   * so the component is always renderable without authored data.
   */
  defaults: T;
  /** The React component to mount when this component name is encountered in the content tree. */
  component: React.FC<CodefolioProps<T>>;
}

/**
 * Internal registry mapping component names to their full {@link CodefolioComponent}
 * registration records.
 *
 * @internal
 */
const _componentRegistry: Record<string, CodefolioComponent<any>> = {};

/**
 * Registers a component in the Codefolio component registry, making it
 * available to the renderer, page editor palette, and content scaffolding.
 *
 * @typeParam T - The shape of the component's data payload, inferred from
 *               `registration.defaults`.
 *
 * @param registration - The full {@link CodefolioComponent} registration
 *                       record including name, defaults, and component.
 * @returns The registered React component.
 *
 * @remarks
 * The `name` field must match the `component` key used in content JSON
 * {@link CanvasNode} trees. If a component is registered under a name that
 * already exists in the registry, it will be silently overridden — useful
 * for userland component overrides.
 *
 * @example
 * ```tsx
 * registerComponent({
 *   name: "hero",
 *   defaults: {
 *     title: "Hello, I am...",
 *     subtitle: "A developer",
 *     cta: { label: "View Work", href: "/work" }
 *   },
 *   component: ({ data, children }) => (
 *     <section>
 *       <h1>{data.title}</h1>
 *       <p>{data.subtitle}</p>
 *       <a href={data.cta.href}>{data.cta.label}</a>
 *       {children}
 *     </section>
 *   )
 * });
 * ```
 */
export const registerComponent = <T extends Record<string, any>,>(
  registration: CodefolioComponent<T>
): React.FC<CodefolioProps<T>> => {
  _componentRegistry[registration.name] = registration;
  return registration.component;
};

/**
 * Retrieves a registered {@link CodefolioComponent} record from the registry
 * by name, including its defaults and component function.
 *
 * @typeParam T - The expected shape of the component's data payload.
 * @param name - The component name to look up.
 * @returns The full {@link CodefolioComponent} record, or `undefined` if no
 *          component is registered under that name.
 *
 * @example
 * ```ts
 * const hero = getComponent("hero");
 * if (hero) {
 *   const scaffolded = hero.defaults; // { title: "Hello, I am...", ... }
 * }
 * ```
 */
export const getComponent = <T extends Record<string, any>,>(
  name: string
): CodefolioComponent<T> | undefined => {
  return _componentRegistry[name];
};

/**
 * Returns all registered components as an array of {@link CodefolioComponent}
 * records, in registration order.
 *
 * @remarks
 * Used by the page editor to populate the component palette — every
 * registered component appears as a draggable entry, with its `defaults`
 * pre-filling the canvas node on drop.
 *
 * @returns A shallow copy of all registered component records.
 *
 * @example
 * ```ts
 * const palette = getAllComponents();
 * // [{ name: "hero", defaults: {...}, component: HeroFC }, ...]
 * ```
 */
export const getAllComponents = (): CodefolioComponent<any>[] => {
  return Object.values(_componentRegistry);
};