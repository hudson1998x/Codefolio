import { Service } from "@decorators/service";
import { OnInit } from "@decorators/di-container";
import fs from "fs";
import path from "path";

const CONFIG_PATH    = path.join(process.cwd(), "build/config.json");
const COMPONENTS_DIR = path.join(process.cwd(), "app/web");

/**
 * The expected shape of a component's `config.json` file.
 * The `key` field is the registry identifier used in `useModuleConfig`.
 */
interface ComponentConfigFile {
  /** The module config key this file belongs to (e.g. `"header"`, `"footer"`). */
  key: string;
  /** The default config payload for this module. */
  config: Record<string, any>;
}

@Service()
export class ConfigService implements OnInit {

  private _cachedConfig?: Record<string, any>;

  /**
   * On startup, collects all component default configs and merges them
   * into `build/config.json`, with existing user values taking priority.
   */
  public async onInit(): Promise<void> {
    const defaults = await this.collectDefaultConfigs();
    const existing = await this.getConfig();

    const merged = Object.keys(defaults).reduce((acc, key) => {
      acc[key] = { ...defaults[key], ...(existing[key] ?? {}) };
      return acc;
    }, {} as Record<string, any>);

    await this.setConfig(merged);
    console.log(`✅ Config initialised — ${Object.keys(defaults).length} module(s) discovered`);
  }

  /**
   * Recursively walks the `app/web` directory collecting every `config.json`
   * file found, parsing each one as a {@link ComponentConfigFile}.
   *
   * The `key` field inside the JSON is used as the config registry key,
   * avoiding any reliance on directory naming conventions or path parsing.
   *
   * Files that are missing the `key` or `config` fields are skipped with
   * a warning so a malformed file never breaks the startup sequence.
   *
   * @returns A flat record of all discovered default configs keyed by
   *          their declared `key` field.
   *
   * @example
   * A `config.json` with this shape:
   * ```json
   * {
   *   "key": "header",
   *   "config": {
   *     "siteTitle": "My Portfolio",
   *     "links": []
   *   }
   * }
   * ```
   * Produces `{ "header": { "siteTitle": "My Portfolio", "links": [] } }`.
   */
  public async collectDefaultConfigs(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    const configFiles = this.findConfigFiles(COMPONENTS_DIR);

    for (const filePath of configFiles) {
      try {
        const raw      = fs.readFileSync(filePath, "utf-8");
        const parsed   = JSON.parse(raw) as ComponentConfigFile;

        if (!parsed.key || !parsed.config) {
          console.warn(`⚠️  Skipping ${filePath} — missing "key" or "config" field`);
          continue;
        }

        result[parsed.key] = parsed.config;
        console.log(`📦 Discovered config for "${parsed.key}" at ${filePath}`);
      } catch (err) {
        console.warn(`⚠️  Failed to parse ${filePath}:`, err);
      }
    }

    return result;
  }

  /**
   * Recursively walks a directory and returns the absolute paths of every
   * `config.json` file found at any depth.
   *
   * @param dir - The directory to walk.
   * @returns An array of absolute file paths.
   * @internal
   */
  private findConfigFiles(dir: string): string[] {
    const results: string[] = [];

    if (!fs.existsSync(dir)) return results;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        results.push(...this.findConfigFiles(fullPath));
      } else if (entry.isFile() && entry.name === "config.json") {
        results.push(fullPath);
      }
    }

    return results;
  }

  public async getConfig(): Promise<Record<string, any>> {
    if (this._cachedConfig) return this._cachedConfig;

    if (!fs.existsSync('build'))
    {
      fs.mkdirSync('build');
    }

    if (!fs.existsSync(CONFIG_PATH)) {
      fs.writeFileSync(CONFIG_PATH, "{}", { encoding: "utf-8" });
    }

    return new Promise((resolve, reject) => {
      fs.readFile(CONFIG_PATH, "utf-8", (err, raw) => {
        if (err) return reject(err);
        try {
          this._cachedConfig = JSON.parse(raw);
          resolve(this._cachedConfig!);
        } catch (parseErr) {
          reject(new Error(`Failed to parse config at ${CONFIG_PATH}: ${parseErr}`));
        }
      });
    });
  }

  public async setConfig(config: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8", (err) => {
        if (err) return reject(err);
        this._cachedConfig = config;
        resolve();
      });
    });
  }

  public async updateConfig(partial: Record<string, any>): Promise<Record<string, any>> {
    const current = await this.getConfig();
    const merged  = { ...current, ...partial };
    await this.setConfig(merged);
    return merged;
  }

  public invalidate(): void {
    this._cachedConfig = undefined;
  }
}