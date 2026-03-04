/**
 * Implemented by any service class that requires async setup logic to run
 * once after the DI container resolves it.
 *
 * {@link Container.initializeServices} checks for this interface at
 * initialisation time and awaits {@link onInit} before moving to the next
 * service.
 *
 * @example
 * ```ts
 * @Service()
 * export class DatabaseService implements OnInit {
 *   async onInit() {
 *     await this.connect();
 *   }
 * }
 * ```
 */
export interface OnInit {
  /**
   * Lifecycle hook invoked by the DI container after the service is
   * instantiated. May be synchronous or asynchronous.
   */
  onInit(): void | Promise<void>;
}

/**
 * A minimal, reflection-based inversion-of-control container that provides
 * singleton resolution and sequential service initialisation.
 *
 * @remarks
 * Constructor parameter types are inferred at runtime via the TypeScript
 * `emitDecoratorMetadata` compiler option and the `reflect-metadata` polyfill.
 * Classes must be decorated (e.g. with {@link Service}) for this metadata to
 * be emitted.
 *
 * All resolved instances are cached as singletons — calling {@link resolve}
 * multiple times with the same class always returns the same object.
 *
 * @example
 * ```ts
 * // Resolve a class and its full dependency tree in one call.
 * const mailer = Container.resolve(MailerService);
 *
 * // Resolve and initialise a prioritised list of services at startup.
 * await Container.initializeServices([
 *   DatabaseService,
 *   MailerService,
 *   HttpService,
 * ]);
 * ```
 */
export class Container {
  /**
   * Singleton cache. Maps a constructor to its single shared instance.
   * @internal
   */
  private static instances = new Map<any, any>();

  /**
   * Resolves a class and its full dependency tree, returning a singleton
   * instance.
   *
   * Resolution is recursive: each constructor parameter is itself resolved
   * through the container before the target class is instantiated. Circular
   * dependencies will cause a stack overflow.
   *
   * @typeParam T - The type of the resolved instance.
   * @param target - The class constructor to resolve.
   * @returns The singleton instance of `target`.
   *
   * @example
   * ```ts
   * const http = Container.resolve(HttpService);
   * ```
   */
  static resolve<T>(target: new (...args: any[]) => T): T {
    // Return the cached singleton if this class has already been resolved.
    if (this.instances.has(target)) {
      return this.instances.get(target);
    }

    // Read constructor parameter types emitted by TypeScript's
    // `emitDecoratorMetadata` — requires the `reflect-metadata` polyfill.
    const paramTypes = Reflect.getMetadata("design:paramtypes", target) || [];

    const dependencies = paramTypes.map((dep: any) => Container.resolve(dep));

    const instance = new target(...dependencies);

    this.instances.set(target, instance);

    return instance;
  }

  /**
   * Resolves each service in the provided list and, if it implements
   * {@link OnInit}, awaits its `onInit` lifecycle hook before proceeding
   * to the next service.
   *
   * @remarks
   * Services are initialised **sequentially** in array order, so place
   * foundational services (e.g. database, config) before those that depend
   * on them.
   *
   * @param services - Ordered list of service constructors to resolve and
   *                   initialise.
   * @returns A promise that resolves once every service's `onInit` (if
   *          present) has completed.
   *
   * @example
   * ```ts
   * await Container.initializeServices([
   *   DatabaseService, // initialised first
   *   HttpService,     // initialised second
   * ]);
   * ```
   */
  static async initializeServices(services: any[]) {
    for (const ServiceClass of services) {
      const instance = this.resolve(ServiceClass);

      if (typeof (instance as OnInit).onInit === "function") {
        await (instance as OnInit).onInit();
      }
    }
  }
}