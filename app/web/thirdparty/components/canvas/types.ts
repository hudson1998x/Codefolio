/**
 * Represents a single node in the Codefolio content tree — the fundamental
 * unit of the rendering pipeline.
 *
 * A page is expressed as a tree of `CanvasNode` objects, where each node
 * maps to a registered component, carries its own data payload, and may
 * contain arbitrarily nested children. The router resolves the content JSON
 * and hands the root `CanvasNode` to the renderer, which walks the tree
 * recursively.
 *
 * @remarks
 * The `component` key is a string identifier that the renderer uses to look
 * up the registered TSX component to mount. Both public pages and admin pages
 * are expressed as `CanvasNode` trees — there is no special-casing for either.
 *
 * @example
 * ```ts
 * // A simple page tree
 * const page: CanvasNode = {
 *   component: "page",
 *   data: { title: "Work" },
 *   children: [
 *     {
 *       component: "project-card",
 *       data: { title: "Project A", href: "/work/project-a" },
 *       children: [],
 *     },
 *     {
 *       component: "project-card",
 *       data: { title: "Project B", href: "/work/project-b" },
 *       children: [],
 *     },
 *   ],
 * };
 * ```
 */
export type CanvasNode = {
  /**
   * The string identifier of the registered TSX component to render for this
   * node. Must match a key in the component registry.
   */
  component: string;
  /**
   * Arbitrary data payload passed as props to the resolved component.
   * Shape is component-specific and defined by the component's own
   * `useModuleConfig` fallback.
   */
  data: Record<string, any>;
  /**
   * Nested child nodes rendered within this component. An empty array
   * denotes a leaf node.
   */
  children: CanvasNode[];
};