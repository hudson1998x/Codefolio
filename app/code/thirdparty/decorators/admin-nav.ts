import "reflect-metadata";
import { META } from "../../metadata";

/**
 * Represents a single item registered in the admin navigation metadata.
 */
interface AdminNavItemMetadata {
  /** The human-readable label displayed in the admin navigation UI. */
  label: string;
  /** The key of the parent nav item, used to nest this item in a sub-menu. Omit for top-level items. */
  parent: string | undefined;
  /** The name of the decorated method that this nav item is associated with. */
  propertyKey: string | symbol;
  /** used to sort. */
  sortOrder: number;
}

/**
 * Method decorator that registers the decorated route handler as an item in
 * the admin navigation menu.
 *
 * Metadata is stored on the class constructor under the {@link META.adminNav}
 * key so it can be read alongside other route metadata at bootstrap time.
 *
 * @param label  - The human-readable label rendered in the admin nav UI.
 * @param parent - Optional key of a parent nav item. When provided, this item
 *                 is nested as a child of that parent in the menu hierarchy.
 *
 * @returns A {@link MethodDecorator} that appends an {@link AdminNavItemMetadata}
 *          entry to the constructor's reflect metadata.
 *
 * @example
 * ```ts
 * // Top-level nav item
 * @AdminNavItem("Dashboard")
 * dashboard(req: Request, res: Response) { ... }
 *
 * // Nested under a "Settings" parent
 * @AdminNavItem("Users", "Settings")
 * listUsers(req: Request, res: Response) { ... }
 * ```
 */
export function AdminNavItem(label: string, parent?: string, sortOrder: number = 100): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    // Stored on the constructor so it's accessible alongside the route metadata.
    const adminNavItems: AdminNavItemMetadata[] =
      Reflect.getMetadata(META.adminNav, target.constructor) || [];

    adminNavItems.push({
      label,
      parent,
      propertyKey,
      sortOrder
    });

    Reflect.defineMetadata(
      META.adminNav,
      adminNavItems,
      target.constructor
    );
  };
}