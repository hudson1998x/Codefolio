import "reflect-metadata";
import './jsx-factory/global'
import './vcs'
import './media'
import './pages'
import './dev'
import './Prefab'
import './Blog'
import './Documents'
import './health'
import './Projects'
import './Skills'
import './Employment'
import './Education'
import './Certification'
import './Achievement'
import './typescript/service'
import './cv'

// =================
// Module imports
// =================

/**
 * Base content import, this functionality underpins ALL content modification
 * so it's vital it's one of the fist things loaded.
 */
import './content';
import './configuration'
/**
 * Importing first party stuff.
 */
import './../user/index'

/**
 * Admin dashboard controller and its routes. Must be imported before
 * {@link getRegisteredServices} is called so the {@link Service} and
 * {@link Controller} decorators have run and registered everything.
 */
import "./admindashboard";

// =================

import "./../metadata";


import "./decorators/service";
import "./eventing/events";
import "./http";
import "./esbuild";

import { getRegisteredServices } from "./decorators/service";
import { Container } from "./decorators/di-container";
import { HttpService } from "./http/service";
import { publish } from "./eventing/events";

/**
 * Bootstraps the Codefolio local development server.
 *
 * Execution order:
 * 1. All module-level decorators (`@Service`, `@Controller`, `@Get`, etc.)
 *    have already run by the time this function is called, populating the
 *    global service and controller registries via reflect metadata.
 * 2. Every registered service is resolved from the DI container and its
 *    {@link OnInit} lifecycle hook is awaited in registration order.
 * 3. {@link HttpService} is resolved to trigger its `onInit`, which starts
 *    the Express and WebSocket servers.
 *
 * @remarks
 * Import order at the top of this file is load-bearing — modules must be
 * imported before `getRegisteredServices` is called, or their decorators
 * will not have fired and they will be absent from the registry.
 *
 * @returns A promise that resolves once all services are initialised.
 */
async function start() {
  const services = getRegisteredServices();

  console.log(`Found ${services.length} services`);

  await Container.initializeServices(services, (service: Function) => {
    if (service.constructor == HttpService)
    {
        if (process.argv.indexOf("--expose-routes") > -1)
        {
          console.log('Route expose mode enabled');
          (service as HttpService).exposeRoutesInConsole();
        }
    }
  });

  console.log("✅ All services initialized");

  await publish('services-loaded', services);
}

start().catch((err) => {
  console.error("❌ Startup failed:", err);
  process.exit(1);
});