import { META } from "../../metadata";

/**
 * Module-level registry of all classes decorated with {@link Service}.
 * Populated at decoration time (i.e. when the module is first imported).
 *
 * @internal
 */
const serviceRegistry: any[] = [];

/**
 * Class decorator that marks a class as a DI-managed service and registers
 * it for automatic initialisation at bootstrap time.
 *
 * Two side effects occur at decoration time:
 * 1. A `true` flag is written to the class's reflect metadata under
 *    {@link META.service}, allowing the container to identify services
 *    by inspection.
 * 2. The class is appended to the module-level {@link serviceRegistry},
 *    making it discoverable via {@link getRegisteredServices} without
 *    requiring explicit imports in the bootstrap file.
 *
 * @returns A {@link ClassDecorator} that registers the target class as a
 *          service.
 *
 * @example
 * ```ts
 * @Service()
 * export class MailerService implements OnInit {
 *   async onInit() {
 *     await this.connect();
 *   }
 * }
 * ```
 */
export function Service(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(META.service, true, target);
    serviceRegistry.push(target);
  };
}

/**
 * Returns all classes registered via the {@link Service} decorator, in
 * registration order.
 *
 * @remarks
 * Intended to be called once during bootstrap to pass the full service list
 * to {@link Container.initializeServices}. Registration order reflects the
 * order in which service modules were first imported, so import order in
 * your entry point determines initialisation sequence.
 *
 * @returns A shallow copy — mutating the returned array does not affect the
 *          internal registry.
 *
 * @example
 * ```ts
 * await Container.initializeServices(getRegisteredServices());
 * ```
 */
export function getRegisteredServices() {
  return [...serviceRegistry];
}