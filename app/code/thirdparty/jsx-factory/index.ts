import { CanvasNode } from "../frontend/types";

/**
 * JSX factory that produces {@link CanvasNode} objects instead of React
 * elements, allowing controllers to express page trees using JSX syntax
 * that compiles directly to Codefolio's content JSON format.
 *
 * Aliased as `react` in the Node tsconfig so TypeScript's JSX machinery
 * resolves to this factory rather than React — no React dependency at
 * runtime on the Node side.
 *
 * @param type     - The component name string (e.g. `"section"`, `"field"`).
 * @param props    - The JSX props, spread directly into `data`. `children`
 *                   is extracted and normalised separately.
 * @param children - Zero or more child {@link CanvasNode} elements.
 * @returns A {@link CanvasNode} representing the element.
 *
 * @example
 * ```tsx
 * return (
 *   <ui-Section title="My Work">
 *     <ui-Button>Save changes</ui-Button>
 *   </ui-Section>
 * );
 * // compiles to:
 * // {
 * //   component: "Section",
 * //   data: { title: "My Work" },
 * //   children: [
 * //     {
 * //       component: "Button",
 * //       data: {},
 * //       children: [
 * //         { component: "text", data: { textContent: "Save changes" }, children: [] }
 * //       ]
 * //     }
 * //   ]
 * // }
 * ```
 */
export const h = (
  type: string | Function,
  props: Record<string, any> | null,
  ...children: (CanvasNode | CanvasNode[] | string)[]
): CanvasNode => {
  const { children: _ignore, ...data } = props ?? {};

  const raw = typeof type === "function" ? type.name : type;
  const component = raw.startsWith("ui-") ? raw.substring(3, raw.length) : raw;

  // Normalise all children — wrap raw strings as text nodes so the canvas
  // renderer always receives a uniform CanvasNode tree with no raw strings.
  const normalised = children
    .flat()
    .filter(Boolean)
    .map((child): CanvasNode =>
      typeof child === "string"
        ? { component: "text", data: { textContent: child }, children: [] }
        : child as CanvasNode
    );

  return {
    component,
    data,
    children: normalised,
  };
};

/**
 * Fragment factory — flattens fragment children into a plain array so they
 * can be inlined into a parent node's `children` without a wrapper node.
 *
 * @example
 * ```tsx
 * return (
 *   <>
 *     <ui-Input kind="input" label="First" />
 *     <ui-Input kind="input" label="Last" />
 *   </>
 * );
 * ```
 */
export const Fragment = (
  _props: { children?: CanvasNode[] }
): CanvasNode[] => {
  return _props.children ?? [];
};

export default { h, Fragment };