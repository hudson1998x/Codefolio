import { META } from "../../metadata";

/**
 * Class decorator that marks a class as an HTTP controller and registers it
 * globally for route resolution at bootstrap time.
 *
 * Two metadata entries are written:
 * 1. The `basePath` is stored directly on the decorated class under
 *    {@link META.controller}, making it available when the router maps
 *    individual method routes.
 * 2. The class itself is appended to the global {@link META.controllers}
 *    registry so the bootstrap process can discover all controllers without
 *    requiring explicit imports.
 *
 * @param basePath - The URL prefix applied to every route defined on this
 *                   controller (e.g. `"/users"` or `"/admin/products"`).
 *
 * @returns A {@link ClassDecorator} that registers the target class in the
 *          global controller registry.
 *
 * @example
 * ```ts
 * @Controller("/users")
 * export class UserController {
 *   @Get("/")
 *   list(req: Request, res: Response) { ... }
 *
 *   @Get("/:id")
 *   show(req: Request, res: Response) { ... }
 * }
 * // All routes resolve under "/users", e.g. GET /users/:id
 * ```
 */
export function Controller(basePath: string): ClassDecorator {
  return (target: any) => {
    // Store the base path on the class for use during route registration.
    Reflect.defineMetadata(META.controller, basePath, target);

    // Append this controller to the global registry so the router can
    // discover it at bootstrap without requiring explicit imports.
    const controllers = Reflect.getMetadata(META.controllers, global) || [];
    controllers.push(target);
    Reflect.defineMetadata(META.controllers, controllers, global);
  };
}