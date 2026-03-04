// route.decorators.ts
import { META } from "../../metadata";

/**
 * The subset of HTTP methods supported by the routing decorators.
 */
type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/**
 * Represents a single route entry stored in a controller's reflect metadata.
 */
interface RouteMetadata {
  /** The HTTP method this route responds to. */
  method: HttpMethod;
  /** The path segment appended to the controller's base path (e.g. `"/:id"`). */
  path: string;
  /** The name of the controller method that handles this route. */
  handler: string | symbol;
}

/**
 * Factory that produces a method decorator for a given HTTP verb.
 *
 * The decorator appends a {@link RouteMetadata} entry to the constructor's
 * reflect metadata under {@link META.routes}, where the router reads it at
 * bootstrap time to register the handler.
 *
 * @param method - The HTTP verb to bind the decorated method to.
 * @returns A function that accepts a `path` and returns a {@link MethodDecorator}.
 *
 * @internal Prefer the exported verb shortcuts ({@link Get}, {@link Post}, etc.)
 *           over calling this directly.
 */
function createRoute(method: HttpMethod) {
  return (path: string): MethodDecorator => {
    return (target, propertyKey) => {
      const routes: RouteMetadata[] =
        Reflect.getMetadata(META.routes, target.constructor) || [];

      routes.push({
        method,
        path,
        handler: propertyKey,
      });

      Reflect.defineMetadata(META.routes, routes, target.constructor);
    };
  };
}

/**
 * Registers the decorated method as a handler for `GET` requests at `path`.
 * @param path - Route path relative to the controller's base path.
 * @example
 * ```ts
 * @Get("/:id")
 * show(req: Request, res: Response) { ... }
 * ```
 */
export const Get = createRoute("get");

/**
 * Registers the decorated method as a handler for `POST` requests at `path`.
 * @param path - Route path relative to the controller's base path.
 * @example
 * ```ts
 * @Post("/")
 * create(req: Request, res: Response) { ... }
 * ```
 */
export const Post = createRoute("post");

/**
 * Registers the decorated method as a handler for `PUT` requests at `path`.
 * @param path - Route path relative to the controller's base path.
 * @example
 * ```ts
 * @Put("/:id")
 * replace(req: Request, res: Response) { ... }
 * ```
 */
export const Put = createRoute("put");

/**
 * Registers the decorated method as a handler for `PATCH` requests at `path`.
 * @param path - Route path relative to the controller's base path.
 * @example
 * ```ts
 * @Patch("/:id")
 * update(req: Request, res: Response) { ... }
 * ```
 */
export const Patch = createRoute("patch");

/**
 * Registers the decorated method as a handler for `DELETE` requests at `path`.
 * @param path - Route path relative to the controller's base path.
 * @example
 * ```ts
 * @Delete("/:id")
 * destroy(req: Request, res: Response) { ... }
 * ```
 */
export const Delete = createRoute("delete");