import { Service } from "app/code/thirdparty/decorators/service";
import { Container } from "app/code/thirdparty/decorators/di-container";
import { HttpService } from "../http/service";
import { context, Plugin } from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import { WebsiteHealthService } from "../health/service";

/**
 * Service responsible for managing the esbuild bundler lifecycle.
 *
 * Initialises a single esbuild watch context for the React SPA frontend
 * (TSX + SCSS). On a successful build, a `"reload"` message is broadcast
 * via {@link HttpService} so connected clients hot-reload automatically.
 *
 * @remarks
 * Backend controller TSX files are handled directly by `tsx` at runtime —
 * no esbuild compilation step is needed on the Node side.
 *
 * This service is intended for development use only. The build output is
 * unminified and includes source maps. `NODE_ENV` is hard-coded to
 * `"development"`.
 */
@Service()
export class EsbuildService {
  /** Resolved {@link HttpService} instance used to broadcast reload events. */
  private httpService: HttpService;

  /**
   * Creates an instance of {@link EsbuildService} and resolves its
   * dependencies from the DI container.
   */
  constructor() {
    this.httpService = Container.resolve(HttpService);
  }

  /**
   * Bootstraps the frontend esbuild watch context and begins listening
   * for file changes.
   *
   * @returns A promise that resolves once the watcher is active.
   * @throws Will throw if esbuild fails to create the watch context.
   */
  async onInit() {
    console.log("🛠 Starting Esbuild watch for frontend (TSX + SCSS)...");

    /**
     * Plugin that broadcasts a `"reload"` event to all connected WebSocket
     * clients after every successful build.
     */
    const onRebuildPlugin: Plugin = {
      name: "onRebuild",
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length === 0) {
            console.log("✅ Build succeeded — broadcasting reload");
            Container.resolve(HttpService).broadcast("reload");
          } else {
            console.error("❌ Build failed:", result.errors);
          }
        });
      },
    };

    const health: WebsiteHealthService = Container.resolve(WebsiteHealthService)

    const ctx = await context({
      entryPoints: ["./app/web/index.tsx"],
      bundle: true,
      outfile: "build/app.js",
      sourcemap: true,
      minify: false,
      format: "esm",
      jsx: "automatic",
      alias: {
        "@router":     "./app/web/thirdparty/router.tsx",
        "@config":     "./app/web/thirdparty/providers/configuration.tsx",
        "@components": "./app/web/thirdparty/components",
        "@decorators": "./app/code/thirdparty/decorators",
        "@events":     "./app/code/thirdparty/eventing/events.ts",
        "@services":   "./app/code/services",
        "@controllers":"./app/code/controllers",
        "@utils":      "./app/code/utils",
      },
      plugins: [
        // TODO: Future "Health" endpoint that doesn't pollute the console. 
        sassPlugin({
          type: "css",
          quietDeps: true,
          logger: {
            warn(message, options) {
              health.addHealthWarning({
                message: message,
                file: options?.span?.url?.pathname ?? "unknown",
                line: String(options?.span?.start?.line ?? "0"),
              });
            }
          }
        }),
        onRebuildPlugin
      ],
      loader: {
        ".ts":   "tsx",
        ".tsx":  "tsx",
        ".js":   "js",
        ".jsx":  "jsx",
        ".scss": "css",
      },
      define: {
        "process.env.NODE_ENV": '"development"',
      },
    });

    await ctx.watch();

    console.log("✅ Watching frontend files (TSX + SCSS)...");
  }
}