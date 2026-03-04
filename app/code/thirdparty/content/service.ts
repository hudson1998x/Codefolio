import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";
import * as readline from "readline";
import { publish } from "@events";
import { Container } from "@decorators/di-container";
import { HttpService } from "../http/service";
import { toEntityLabel } from "./utils";

const CONTENT_ROOT = path.resolve("content");

/**
 * Abstract base class providing file-system-backed CRUD for any entity type.
 *
 * Directory layout:
 *   content/{collectionName}/
 *     .auto_increment   — next available numeric ID (plain text integer)
 *     index.ndjson      — newline-delimited JSON; one entity record per line
 *     1.json, 2.json …  — individual entity files
 *
 * The index is streamed line-by-line so the entire file is never loaded into
 * memory at once. Each line is a valid, standalone JSON object.
 *
 * Every operation dispatches before/after events through the publish pipeline.
 */
export abstract class ContentService<T extends { id?: number }> {

    // ── Subclass contract ────────────────────────────────────────────────────

    protected abstract getCollectionName(): string;

    // ── Path helpers ─────────────────────────────────────────────────────────

    private get collectionDir(): string {
        return path.join(CONTENT_ROOT, this.getCollectionName());
    }

    private entityPath(id: number): string {
        return path.join(this.collectionDir, `${id}.json`);
    }

    private get autoIncrementPath(): string {
        return path.join(this.collectionDir, ".auto_increment");
    }

    private get indexPath(): string {
        return path.join(this.collectionDir, "index.ndjson");
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    /**
     * Bootstraps the collection's directory structure on service initialisation.
     *
     * Creates (if not already present):
     *   - `content/{collectionName}/`   — the collection directory
     *   - `index.ndjson`                — empty index file
     *   - `.auto_increment`             — counter initialised to `0`
     *
     * Safe to call multiple times — all operations are no-ops when the targets
     * already exist, so existing data is never clobbered.
     */
    public async onInit(): Promise<void> {
        await fsp.mkdir(this.collectionDir, { recursive: true });

        // Initialise the index only if it doesn't exist yet.
        try {
            await fsp.access(this.indexPath);
        } catch {
            await fsp.writeFile(this.indexPath, "", "utf8");
        }

        // Initialise the auto-increment counter only if it doesn't exist yet.
        try {
            await fsp.access(this.autoIncrementPath);
        } catch {
            await fsp.writeFile(this.autoIncrementPath, "0", "utf8");
        }

        console.log(`📁 Collection ready: content/${this.getCollectionName()}`);

        const httpService: HttpService = Container.resolve(HttpService);

        httpService.addCustomNavEntry({
            label: toEntityLabel(this.getCollectionName()),
            href: '/en-admin/' + this.getCollectionName() + '/',
        });
    }

    // ── Low-level helpers ────────────────────────────────────────────────────

    private async ensureCollectionDir(): Promise<void> {
        await fsp.mkdir(this.collectionDir, { recursive: true });
    }

    private async nextId(): Promise<number> {
        let current = 0;
        try {
            const raw = await fsp.readFile(this.autoIncrementPath, "utf8");
            current = parseInt(raw.trim(), 10);
        } catch { /* file doesn't exist yet — start at 0 */ }
        const next = current + 1;
        await fsp.writeFile(this.autoIncrementPath, String(next), "utf8");
        return next;
    }

    private async writeEntity(entity: T & { id: number }): Promise<void> {
        await fsp.writeFile(
            this.entityPath(entity.id),
            JSON.stringify(entity, null, 2),
            "utf8",
        );
    }

    // ── NDJSON index ─────────────────────────────────────────────────────────

    /**
     * Open the index and yield one parsed record per line.
     * Blank lines and lines that fail to parse are silently skipped.
     */
    private async *streamIndex(): AsyncGenerator<T & { id: number }> {
        let stream: fs.ReadStream;
        try {
            // Probe for existence before handing to readline — createReadStream
            // is lazy and won't throw until the first read otherwise.
            await fsp.access(this.indexPath);
            stream = fs.createReadStream(this.indexPath, { encoding: "utf8" });
        } catch {
            return; // Index doesn't exist yet — nothing to stream.
        }

        const rl = readline.createInterface({
            input: stream,
            crlfDelay: Infinity,
        });

        for await (const line of rl) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
                yield JSON.parse(trimmed) as T & { id: number };
            } catch { /* malformed line — skip */ }
        }
    }

    /**
     * Append a single record to the index as a new line.
     * Used only on create — O(1), no rewrite needed.
     */
    private async appendToIndex(entity: T & { id: number }): Promise<void> {
        await fsp.appendFile(this.indexPath, JSON.stringify(entity) + "\n", "utf8");
    }

    /**
     * Stream the entire index, apply `transform` to each record, and atomically
     * rewrite the file via a temp file + rename. Records for which `transform`
     * returns `null` are dropped (used for removal).
     */
    private async rewriteIndex(
        transform: (record: T & { id: number }) => (T & { id: number }) | null,
    ): Promise<void> {
        const tmp = this.indexPath + ".tmp";
        const writer = fs.createWriteStream(tmp, { encoding: "utf8" });

        for await (const record of this.streamIndex()) {
            const result = transform(record);
            if (result !== null) {
                writer.write(JSON.stringify(result) + "\n");
            }
        }

        await new Promise<void>((resolve, reject) => {
            writer.end((err?: Error | null) => (err ? reject(err) : resolve()));
        });

        // Atomic swap — readers never see a partially-written index.
        await fsp.rename(tmp, this.indexPath);
    }

    // ── Public CRUD API ──────────────────────────────────────────────────────

    /**
     * Persist a new entity.
     *
     * Pipeline:
     *   `{collection}:before-create` → assign ID → write file → append to index
     *   → `{collection}:after-create`
     */
    public async create(entity: T): Promise<T> {
        await this.ensureCollectionDir();

        const collection = this.getCollectionName();
        const prepared = await publish<T>(`${collection}:before-create`, entity);

        const id = await this.nextId();
        const withId = { ...prepared, id } as T & { id: number };

        await this.writeEntity(withId);
        await this.appendToIndex(withId);

        return publish<T>(`${collection}:after-create`, withId);
    }

    /**
     * Apply a partial update to an existing entity.
     *
     * Pipeline:
     *   `{collection}:before-update` → load → merge → write file
     *   → rewrite index line → `{collection}:after-update`
     *
     * @throws If the entity does not exist.
     */
    public async update(id: number, payload: Partial<T>): Promise<T> {
        const collection = this.getCollectionName();

        const prepared = await publish<Partial<T>>(
            `${collection}:before-update`,
            payload,
        );

        const current = await this.load(id);
        if (current === null) {
            throw new Error(
                `[${collection}] Entity with id=${id} not found; cannot update.`,
            );
        }

        const merged = { ...current, ...prepared, id } as T & { id: number };

        await this.writeEntity(merged);
        await this.rewriteIndex((record) =>
            record.id === id ? merged : record,
        );

        return publish<T>(`${collection}:after-update`, merged);
    }

    /**
     * Delete an entity by id.
     *
     * Pipeline:
     *   load → `{collection}:before-delete` → unlink file
     *   → drop line from index → `{collection}:after-delete`
     *
     * @throws If the entity does not exist.
     */
    public async remove(id: number): Promise<T> {
        const collection = this.getCollectionName();

        const current = await this.load(id);
        if (current === null) {
            throw new Error(
                `[${collection}] Entity with id=${id} not found; cannot remove.`,
            );
        }

        const prepared = await publish<T>(`${collection}:before-delete`, current);

        try {
            await fsp.unlink(this.entityPath(id));
        } catch (err: unknown) {
            if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
        }

        // Drop the record — transform returns null so it's excluded from rewrite.
        await this.rewriteIndex((record) => (record.id === id ? null : record));

        return publish<T>(`${collection}:after-delete`, prepared);
    }

    /**
     * Load a single entity by id.
     *
     * Returns `null` when the entity does not exist — callers must handle this.
     *
     * Pipeline:
     *   `{collection}:before-load` (receives id) → read file
     *   → `{collection}:after-load`
     */
    public async load(id: number): Promise<T | null> {
        const collection = this.getCollectionName();

        await publish<number>(`${collection}:before-load`, id);

        let entity: T;
        try {
            const raw = await fsp.readFile(this.entityPath(id), "utf8");
            entity = JSON.parse(raw) as T;
        } catch (err: unknown) {
            if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
            throw err;
        }

        return publish<T>(`${collection}:after-load`, entity);
    }

    /**
     * Stream the index line-by-line, filter by predicate, and return one page.
     *
     * Only `size` matching records are ever held in memory — everything else
     * is yielded and discarded by the async generator as we go.
     *
     * Pipeline:
     *   `{collection}:search-results` (receives the page slice)
     */
    public async search(
        predicate: (value: T) => boolean,
        page: number = 1,
        size: number = 20,
    ): Promise<T[]> {
        const collection = this.getCollectionName();

        const skip = (page - 1) * size;
        const results: Array<T & { id: number }> = [];
        let matched = 0;

        for await (const record of this.streamIndex()) {
            if (!predicate(record)) continue;

            matched++;
            if (matched <= skip) continue;      // Haven't reached our page yet.

            results.push(record);
            if (results.length === size) break; // Page is full — stop streaming.
        }

        return publish<T[]>(`${collection}:search-results`, results);
    }
}