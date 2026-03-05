import { Request, Response } from "express";
import { Get, Post, Patch, Delete } from "@decorators/routes";
import { ContentService } from "./service";

/**
 * Abstract controller that exposes a {@link ContentService} as a standard
 * REST API. Extend it, provide a service instance, and the five endpoints
 * are ready to go.
 *
 * Generated routes (relative to whatever base path your @Controller sets):
 *
 *   GET    /          — search  (?page, ?size, ?filter as JSON)
 *   GET    /:id       — load one
 *   POST   /          — create
 *   PATCH  /:id       — partial update
 *   DELETE /:id       — remove
 *
 * Usage
 * -----
 * ```ts
 * @Controller("content/posts")
 * export class PostController extends AutoController<Post> {
 *     protected service = Container.resolve(PostService);
 * }
 * ```
 *
 * Search filtering
 * ----------------
 * Pass `?filter={"status":"published"}` — a JSON object whose key/value pairs
 * are shallow AND-matched against each index record.
 */
/**
 * Collapse a raw Express query-param value down to a plain string or undefined.
 * Express types query values as `string | string[] | ParsedQs | ParsedQs[]`;
 * when an array arrives we take the last value (consistent with most frameworks).
 */
function qs(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return qs(value[value.length - 1]);
    if (typeof value === "object") return undefined; // ParsedQs — ignore
    return String(value);
}

/**
 * Parse an id out of req.params, which may be typed as string | string[].
 * Returns NaN if the value is missing, an array with no entries, or non-numeric.
 */
function parseId(value: string | string[]): number {
    const raw = Array.isArray(value) ? value[value.length - 1] : value;
    return parseInt(raw ?? "", 10);
}

export abstract class ContentController<T extends { id?: number }> {

    protected abstract service: ContentService<T>;

    /**
     * GET / — search with optional pagination and filter.
     *
     * Query params:
     *   page   {number}  default 1
     *   size   {number}  default 20
     *   filter {string}  JSON object — shallow key/value AND match
     */
    @Get("/")
    public async search(req: Request, res: Response): Promise<void> {
        const page = Math.max(1, parseInt(qs(req.query.page) ?? "", 10) || 1);
        const size = Math.max(1, parseInt(qs(req.query.size) ?? "", 10) || 20);

        let filterObj: Record<string, unknown> = {};
        const rawFilter = qs(req.query.filter);
        if (rawFilter) {
            try {
                filterObj = JSON.parse(rawFilter);
            } catch {
                res.status(400).json({ ok: false, error: "Invalid JSON in `filter` query param." });
                return;
            }
        }

        const filterKeys = Object.keys(filterObj);
        // Change your predicate logic to this:
        const predicate = filterKeys.length === 0
            ? () => true
            : (record: Record<string, any>) =>
                filterKeys.every((k) => {
                    const recordVal = String(record[k] ?? "").toLowerCase();
                    const filterVal = String(filterObj[k] ?? "").toLowerCase();
                    return recordVal.includes(filterVal); // Partial match instead of ===
                });

        const results = await this.service.search(predicate as (v: T) => boolean, page, size);
        res.json({ ok: true, page, size, results });
    }

    /**
     * GET /:id — load a single entity.
     */
    @Get("/:id")
    public async load(req: Request, res: Response): Promise<void> {
        const id = parseId(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ ok: false, error: "id must be a number." });
            return;
        }

        const entity = await this.service.load(id);
        if (entity === null) {
            res.status(404).json({ ok: false, error: `No record with id=${id}.` });
            return;
        }

        res.json({ ok: true, entity });
    }

    /**
     * POST / — create a new entity from the request body.
     */
    @Post("/")
    public async create(req: Request, res: Response): Promise<void> {
        const entity = await this.service.create(req.body as T);
        res.status(201).json({ ok: true, entity });
    }

    /**
     * PATCH /:id — apply a partial update to an existing entity.
     */
    @Patch("/:id")
    public async update(req: Request, res: Response): Promise<void> {
        const id = parseId(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ ok: false, error: "id must be a number." });
            return;
        }

        try {
            const entity = await this.service.update(id, req.body as Partial<T>);
            res.json({ ok: true, entity });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            res.status(404).json({ ok: false, error: msg });
        }
    }

    /**
     * DELETE /:id — remove an entity.
     */
    @Delete("/:id")
    public async remove(req: Request, res: Response): Promise<void> {
        const id = parseId(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ ok: false, error: "id must be a number." });
            return;
        }

        try {
            const entity = await this.service.remove(id);
            res.json({ ok: true, entity });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            res.status(404).json({ ok: false, error: msg });
        }
    }

    public getCollectionName(): string
    {
        return this.getTargetEntity().name.toLowerCase();
    }

    public abstract getTargetEntity(): Function;
}