/**
 * Centralised registry of reflect-metadata keys used across the Codefolio
 * decorator system.
 *
 * Each key is a unique {@link Symbol} to guarantee there are no collisions
 * with third-party metadata or between keys within the framework itself.
 *
 * @remarks
 * These keys form the shared contract between the decorators that **write**
 * metadata (`@Controller`, `@Service`, `@Get`, `@AdminNavItem`, etc.) and
 * the consumers that **read** it (`Container`, `HttpService`). Any new
 * decorator that needs to store reflect metadata should register its key
 * here rather than defining ad-hoc symbols elsewhere.
 *
 * @example
 * ```ts
 * // Writing (decorator side)
 * Reflect.defineMetadata(META.controller, basePath, target);
 *
 * // Reading (consumer side)
 * const basePath = Reflect.getMetadata(META.controller, ControllerClass);
 * ```
 */
export const META = {
  /** The base path string stored on a class decorated with `@Controller`. */
  controller: Symbol("controller"),

  /** The global registry of all classes decorated with `@Controller`. */
  controllers: Symbol("controllers"),

  /** The list of {@link RouteMetadata} entries stored on a controller class. */
  routes: Symbol("routes"),

  /** A boolean flag stored on a class decorated with `@Service`. */
  service: Symbol("service"),

  /** The list of {@link AdminNavItemMetadata} entries stored on a controller class. */
  adminNav: Symbol("adminNav"),

  /** The list of {@link} Entities */
  entities: Symbol("entities"),

  entity: Symbol("entity"),
  
  fields: Symbol("fields"),
};