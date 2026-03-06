import { Service } from "../decorators/service";
import express, { Request, Response, NextFunction } from "express";
import { META } from "../../metadata";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { Container } from "app/code/thirdparty/decorators/di-container";
import fs from "fs";
import path from "path";
import { ConfigService } from "../configuration/service";

export type NavConfig = {
  label: string;
  href?: string;
  icon?: string;
  children?: NavConfig[];
};

/**
 * Core HTTP and WebSocket service for the Codefolio local development server.
 *
 * Responsible for:
 * - Serving the compiled SPA and static content/media assets
 * - Registering controllers and their routes from reflect metadata
 * - Building and exposing the admin navigation tree at `/en-admin/nav.json`
 * - Managing a WebSocket server for live reload and cache key distribution
 * - Writing `index.html` to disk with a unique cache key on every server start
 *
 * @remarks
 * This service is **local-only** and is never included in the static export.
 * The admin API surface, WebSocket server, and nav endpoint are all
 * development/authoring concerns exclusively.
 *
 * The cache key is generated once at instantiation time and injected into
 * every HTML response and broadcast to WebSocket clients, ensuring the SPA
 * and all connected browsers stay in sync after a rebuild.
 */
@Service()
export class HttpService {
  private app = express();
  private port = 3000;
  private server!: http.Server;
  private wss!: WebSocketServer;

  /**
   * Unique cache-busting token generated at server start. Appended as a query
   * parameter to all JS and CSS asset URLs, and exposed to the SPA via
   * `window.__CACHE_KEY__`. Broadcast to WebSocket clients on connection so
   * they can synchronise their local cache state.
   */
  private cacheKey: string;

  /** The resolved admin navigation tree, built from {@link META.adminNav} reflect metadata. */
  private adminNav: NavConfig[] = [];

  /**
   * Generates the cache key and writes the initial `index.html` to disk.
   * Dependencies are resolved by the DI container.
   */
  constructor() {
    this.cacheKey = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  addCustomNavEntry(navItem: NavConfig)
  {
    this.adminNav.push(navItem);
  }

  /**
   * Bootstraps the HTTP and WebSocket servers.
   *
   * Initialisation order:
   * 1. Registers API controllers discovered via reflect metadata
   * 2. Mounts the admin nav endpoint at `GET /en-admin/nav.json`
   * 3. Mounts static middleware for `/build`, `/content`, and `/media`
   * 4. Registers the SPA fallback handler for all non-API routes
   * 5. Creates the HTTP server and attaches the WebSocket server at `/ws`
   * 6. Begins listening on {@link port}
   *
   * @returns A promise that resolves once the server is listening.
   */
  async onInit() {
    console.log("🚀 Starting HTTP & WebSocket server...");
    console.log("🔑 Cache key:", this.cacheKey);

    this.writeIndexHtml();

    this.app.use(express.json());

    this.registerControllers();

    // Handle /en-admin/nav.json with and without trailing slash
    // 1. Serve /build directory at /build
    this.app.use("/build", express.static(path.join(process.cwd(), "build")));

    // 2. Serve /content directory at /content (Preserving the prefix)
    this.app.use("/content", express.static(path.join(process.cwd(), "content")));

    // 3. Serve /media directory at /media
    this.app.use("/media", express.static(path.join(process.cwd(), "media")));

    this.app.use("/app/web/themes", express.static(path.join(process.cwd(), "app/web/themes")));

    // 4. Handle /en-admin/nav.json
    this.app.get(["/en-admin/nav.json", "/en-admin//nav.json"], (req, res) => {
      res.json(this.adminNav);
    });

    this.app.use(
      express.static(path.join(process.cwd(), "content"), {
        fallthrough: true,
      })
    );

    this.app.use("/media", express.static(path.join(process.cwd(), "media")));

    this.app.use(this.pageFallback.bind(this));

    this.server = http.createServer(this.app);

    this.wss = new WebSocketServer({ server: this.server, path: "/ws" });

    this.wss.on("connection", (socket: WebSocket) => {
      console.log("🔌 New WebSocket connection");

      socket.on("message", (msg) => {
        console.log("📨 Received:", msg.toString());
        socket.send(`Server says: ${msg}`);
      });

      // Immediately send the current cache key so the client can
      // synchronise its local cache state on connection.
      socket.send(JSON.stringify({ type: "cacheKey", key: this.cacheKey }));
    });

    this.server.listen(this.port, () => {
      console.log(`✅ Server listening on http://localhost:${this.port}`);
      console.log(`✅ WebSocket server at ws://localhost:${this.port}/ws`);
    });
  }

  /**
   * Discovers all globally registered controllers via reflect metadata,
   * mounts their routes on the Express app, and builds the admin navigation
   * tree from any {@link META.adminNav} metadata present on the controller.
   *
   * @remarks
   * Nav hrefs are normalised by stripping the `/content` prefix and
   * `/page.json` suffix from the full route path, so that admin nav links
   * point at clean SPA routes rather than raw content file paths.
   *
   * URL parameters declared in the route path (e.g. `/:id`) are extracted
   * from `req.params` in declaration order and passed as positional arguments
   * to the handler after `req` and `res`:
   *
   *   handler(req, res, id, next)        // for /:id
   *   handler(req, res, org, repo, next) // for /:org/:repo
   *
   * Handlers that don't declare URL params are unaffected — `next` always
   * comes last regardless of how many (or few) params are present.
   */
  private registerControllers() {
    const controllers: any[] = Reflect.getMetadata(META.controllers, global) || [];
    const flatNav: any[] = [];

    controllers.forEach((ControllerClass) => {
      const basePath: string = Reflect.getMetadata(META.controller, ControllerClass);
      if (!basePath) return;

      const instance: any = Container.resolve(ControllerClass);

      const routes: { method: string; path: string; handler: string }[] =
        (Reflect.getMetadata(META.routes, ControllerClass) || [])
          .slice()
          .sort((a: { path: string }, b: { path: string }) => {
            // Lower score = registered first = higher priority.
            // Each ':param' segment adds 1 point so fully-literal routes
            // always sort ahead of parameterised ones. Routes with the same
            // param count preserve their original declaration order (stable).
            const score = (p: string) =>
              (p.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g) ?? []).length;
            return score(a.path) - score(b.path);
          });

      const navMetadata: any[] = Reflect.getMetadata(META.adminNav, ControllerClass) || [];

      routes.forEach((route) => {
        const fullPath = this.joinPaths("/" + basePath, route.path);

        (this.app as any)[route.method](
          fullPath,
          async (req: Request, res: Response, next: NextFunction) => {
            try {
              // Extract URL params in the order they appear in the path so
              // handlers can receive them as plain positional arguments:
              //   handler(req, res, id, next)
              //   handler(req, res, org, repo, next)
              const paramNames = this.extractParamNames(route.path);
              const paramValues = paramNames.map((name) => req.params[name]);

              const result = await instance[route.handler](req, res, ...paramValues, next);

              if (res.headersSent) return;
              if (result !== undefined) {
                res.json(result);
              } else {
                res.end();
              }
            } catch (err) {
              next(err);
            }
          }
        );

        const nav = navMetadata.find((n) => n.propertyKey === route.handler);
        if (nav) {
          // Strip '/content' prefix and '/page.json' suffix so the nav href
          // points at a clean SPA route rather than the raw content file path.
          let navHref = fullPath
            .replace(/^\/content/, "")
            .replace(/\/page\.json$/, "");

          if (navHref === "") navHref = "/";

          flatNav.push({
            label: nav.label,
            href: navHref,
            parent: nav.parent,
            sortOrder: nav.sortOrder,
            children: [],
          });
        }

        console.log(`✔ ${route.method.toUpperCase()} ${fullPath}`);
      });
    });

    this.adminNav = this.buildNavTree(flatNav.sort((a, b) => a.sortOrder - b.sortOrder));
  }

  /**
   * Extracts URL parameter names from an Express route path in declaration
   * order, so they can be passed as positional arguments to the handler.
   *
   * @example
   * extractParamNames("/:org/:repo") // → ["org", "repo"]
   * extractParamNames("/users/:id/posts/:postId") // → ["id", "postId"]
   * extractParamNames("/static") // → []
   *
   * @param routePath - The route path segment as registered (e.g. `"/:id"`).
   * @returns Ordered array of parameter name strings, without the `:` prefix.
   */
  private extractParamNames(routePath: string): string[] {
    const matches = routePath.matchAll(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
    return Array.from(matches, (m) => m[1]);
  }

  /**
   * Converts a flat array of nav items into a nested {@link NavConfig} tree
   * by matching each item's `parent` label against sibling labels.
   *
   * @param items - Flat list of nav items with optional `parent` label references.
   * @returns The root-level nav nodes with children populated recursively.
   */
  private buildNavTree(items: any[]): NavConfig[] {
    const root: NavConfig[] = [];
    const map: Record<string, NavConfig> = {};

    // First pass — register all items and ensure children array exists
    items.forEach(item => {
        map[item.label] = { ...item, children: item.children ?? [] };
    });

    // Second pass — wire up parents, creating them if missing
    items.forEach(item => {
        if (item.parent) {
            if (!map[item.parent]) {
                // Parent referenced but not in the list — create it
                map[item.parent] = { label: item.parent, children: [] };
                root.push(map[item.parent]);
            }
            map[item.parent].children!.push(map[item.label]);
        } else {
            root.push(map[item.label]);
        }
    });

    return root;
}

  /**
   * Joins multiple URL path segments into a single normalised path, trimming
   * leading and trailing slashes from each segment before joining with `/`.
   *
   * @param parts - Path segments to join (e.g. `"/admin/"`, `"/users"`).
   * @returns A normalised absolute path (e.g. `"/admin/users"`).
   */
  private joinPaths(...parts: string[]): string {
    return (
      "/" +
      parts
        .map((p) => p.replace(/^\/+|\/+$/g, ""))
        .filter(Boolean)
        .join("/")
    );
  }

  /**
   * Normalises a URL path by stripping trailing slashes, ensuring that
   * equivalent paths such as `/en-admin` and `/en-admin/` are treated
   * identically throughout the application.
   *
   * The root path `/` is left unchanged.
   *
   * @param urlPath - The raw URL path to normalise.
   * @returns The normalised path with any trailing slash removed.
   */
  private normalisePath(urlPath: string): string {
    return urlPath.length > 1 ? urlPath.replace(/\/+$/, "") : urlPath;
  }

  /**
   * Express catch-all handler that serves the SPA shell for all non-API
   * routes, enabling client-side routing to take over.
   *
   * Paths are normalised before matching so that `/en-admin` and `/en-admin/`
   * are handled identically. API routes that reach this handler (i.e.
   * unmatched `/api/*` paths) receive a 404 JSON response instead.
   *
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  private async pageFallback(req: Request, res: Response) {
    const normalisedPath = this.normalisePath(req.path);

    if (!normalisedPath.startsWith("/api")) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(await this.outputHtml());
    } else {
      res.status(404).json({ error: "API route not found" });
    }
  }

  /**
   * Broadcasts a raw string message to all currently connected WebSocket
   * clients. Used primarily by {@link EsbuildService} to trigger a live
   * reload in the browser after a successful build.
   *
   * @param message - The message to send to all open connections.
   */
  broadcast(message: string) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Generates the SPA shell HTML string, injecting the current cache key
   * as a query parameter on asset URLs and as `window.__CACHE_KEY__` for
   * runtime access by the SPA.
   *
   * @returns The full HTML string for the SPA shell.
   */
  private async outputHtml(): Promise<string> {

    const configService = Container.resolve(ConfigService);
    const config = await configService.getConfig();

    return `
      <html>
        <head>
          <title>Loading... | ${config?.website?.title ?? 'Untitled website'}</title>
          <meta name="description" content="${config?.website?.description ?? 'No description available'}"/>
          <meta name="keywords" content="${config?.website?.keywords ?? ''}"/>
          <!-- Caching is handled by the app instead !-->
          <meta http-equiv="Cache-Control" content="no-cache">
          <meta name="viewport" content="initial-scale=1.0,width=device-width"/>
        </head>
        <body>
          <div id="root"></div>

          <script>
            const isGithubPages = location.hostname.endsWith("github.io");
            const repo = location.pathname.split("/")[1];
            const BASE = isGithubPages ? "/" + repo : "";

            window.__CACHE_KEY__ = "${this.cacheKey}";

            const css = document.createElement("link");
            css.rel = "stylesheet";
            css.href = BASE + "/build/app.css?cache=" + window.__CACHE_KEY__;
            document.head.appendChild(css);

            const js = document.createElement("script");
            js.type = "module";
            js.src = BASE + "/build/app.js?cache=" + window.__CACHE_KEY__;
            document.body.appendChild(js);
          </script>
        </body>
      </html>
    `;
  }

  /**
   * Writes the SPA shell HTML to `index.html` in the current working
   * directory. Called once at construction time so the file is available
   * immediately, before the HTTP server starts listening.
   */
  private async writeIndexHtml() {
    let filePath = path.join(process.cwd(), "index.html");
    fs.writeFileSync(filePath, await this.outputHtml(), { encoding: "utf-8" });

    filePath = path.join(process.cwd(), "404.html");
    fs.writeFileSync(filePath, await this.outputHtml(), { encoding: "utf-8" });
    console.log(`📝 index.html & 404.html written with cache key ${this.cacheKey}`);
  }
}