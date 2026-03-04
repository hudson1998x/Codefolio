/**
 * Represents a single node in the site navigation tree.
 *
 * Nodes can be nested arbitrarily deep via {@link NavConfig.children},
 * allowing for both flat top-level menus and multi-level dropdown structures.
 *
 * @example
 * ```ts
 * // Simple flat navigation
 * const nav: NavConfig[] = [
 *   { label: "Work", href: "/work" },
 *   { label: "Writing", href: "/writing" },
 *   { label: "Contact", href: "/contact" },
 * ];
 *
 * // Nested navigation with a parent group
 * const nav: NavConfig[] = [
 *   {
 *     label: "Projects",
 *     icon: "folder",
 *     children: [
 *       { label: "Web", href: "/projects/web" },
 *       { label: "Mobile", href: "/projects/mobile" },
 *     ],
 *   },
 * ];
 * ```
 */
export type NavConfig = {
  /** The human-readable label rendered in the navigation UI. */
  label: string;
  /**
   * The URL this node links to. Omit for parent nodes that exist solely
   * to group children — e.g. a "Projects" heading with no page of its own.
   */
  href?: string;
  /** Optional icon identifier passed to the icon component for this nav node. */
  icon?: string;
  /**
   * Nested child nodes. When present, this node acts as a parent group
   * rather than a direct link. Children can themselves have children,
   * enabling arbitrarily deep menu hierarchies.
   */
  children?: NavConfig[];
};