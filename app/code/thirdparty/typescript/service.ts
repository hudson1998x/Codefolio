import { Service } from "@decorators/service";
import { subscribe } from "@events";
import { Content } from "../content/content";
import { ContentService } from "../content/service";
import { getEntityFields, getRegisteredEntities, FieldMetadata } from "@decorators/entity";
import { META } from "../../metadata";
import * as fs from "fs";
import * as path from "path";

const API_DIR  = path.resolve(process.cwd(), 'app/api');
const TSCONFIG = path.resolve(process.cwd(), 'app/web/tsconfig.json');

const BASE_FIELDS = new Set(['id', 'creator', 'created', 'updated']);

const TS_TYPE_MAP: Record<string, string> = {
    String:  'string',
    Number:  'number',
    Boolean: 'boolean',
    Array:   'any[]',
    Object:  'Record<string, any>',
};

const toTsType = (type: any): string =>
    TS_TYPE_MAP[type?.name] ?? 'any';

const toPascalCase = (str: string): string =>
    str.charAt(0).toUpperCase() + str.slice(1);

const toCamelCase = (str: string): string =>
    str.charAt(0).toLowerCase() + str.slice(1);

// emission data for fields is limited on non primitive types. 
// we fallback to any.
const generateInterface = (entityName: string, fields: FieldMetadata[]): string => {
    const lines = fields
        .filter(f => !BASE_FIELDS.has(f.key))
        .map(f => `    ${toCamelCase(f.key)}?: ${toTsType(f.type)};`);

    return [
        `export interface ${toPascalCase(entityName)} {`,
        `    id: number;`,
        `    creator?: string;`,
        `    created?: string;`,
        `    updated?: string;`,
        ...lines,
        `}`,
    ].join('\n');
};

const generateBase = (): string => [
    `import { fetchContent } from './../web/thirdparty/utils/fetch-content'`,
    ``,
    `export async function get<T>(entity: string, id: number): Promise<T> {`,
    `    const res = await fetchContent(\`/content/\${entity}/\${id}.json\`);`,
    `    if (!res.ok) throw new Error(\`Failed to load \${entity}#\${id}: \${res.status}\`);`,
    `    return res.json() as Promise<T>;`,
    `}`,
    ``,
    `export async function search<T>(`,
    `    entity: string,`,
    `    query: string,`,
    `    fields: string[],`,
    `    limit: number = 10`,
    `): Promise<T[]> {`,
    ``,
    `    const results: T[] = [];`,
    `    const q = query.toLowerCase();`,
    ``,
    `    const res = await fetchContent(\`/content/\${entity}/index.ndjson\`);`,
    `    if (!res.ok || !res.body) return [];`,
    ``,
    `    const reader = res.body.getReader();`,
    `    const decoder = new TextDecoder();`,
    `    let buffer = '';`,
    ``,
    `    outer: while (true) {`,
    `        const { done, value } = await reader.read();`,
    `        if (done) break;`,
    ``,
    `        buffer += decoder.decode(value, { stream: true });`,
    `        const lines = buffer.split('\\n');`,
    `        buffer = lines.pop() ?? '';`,
    ``,
    `        for (const line of lines) {`,
    `            const trimmed = line.trim();`,
    `            if (!trimmed) continue;`,
    `            try {`,
    `                const record = JSON.parse(trimmed);`,
    `                const matches = fields.some(function(field) {`,
    `                    const val = record[field];`,
    `                    return val && String(val).toLowerCase().includes(q);`,
    `                });`,
    `                if (matches) {`,
    `                    results.push(record as T);`,
    `                    if (results.length >= limit) break outer;`,
    `                }`,
    `            } catch {}`,
    `        }`,
    `    }`,
    ``,
    `    return results;`,
    `}`,
    ``,
    `export async function loadMany<T>(entity: string, ids: number[]): Promise<T[]> {`,
    `    return Promise.all(ids.map(function(id) {`,
    `        return get<T>(entity, id);`,
    `    }));`,
    `}`,
].join('\n');

const generateApi = (entityName: string, fields: FieldMetadata[]): string => {
    const pascalName = toPascalCase(entityName);

    const searchableFields = fields
        .filter(f => f.searchable && !BASE_FIELDS.has(f.key))
        .map(f => `'${toCamelCase(f.key)}'`);

    const searchableList = `[${searchableFields.join(', ')}]`;

    return [
        `import { get, search, loadMany } from './core-funcs';`,
        ``,
        generateInterface(entityName, fields),
        ``,
        `const ENTITY = '${entityName}';`,
        `const SEARCHABLE = ${searchableList};`,
        ``,
        `/** Load a single ${pascalName} by ID */`,
        `export const load = function(id: number): Promise<${pascalName}> {`,
        `    return get<${pascalName}>(ENTITY, id);`,
        `};`,
        ``,
        `/** Load multiple ${pascalName} records by ID in parallel */`,
        `export const loadAll = function(ids: number[]): Promise<${pascalName}[]> {`,
        `    return loadMany<${pascalName}>(ENTITY, ids);`,
        `};`,
        ``,
        `/** Search ${pascalName} records across: ${searchableFields.join(', ') || 'none'} */`,
        `export const find = function(query: string, limit?: number): Promise<${pascalName}[]> {`,
        `    return search<${pascalName}>(ENTITY, query, SEARCHABLE, limit);`,
        `};`,
    ].join('\n');
};

const writeFile = (filePath: string, content: string): void => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[TypeScriptService] Generated → ${filePath}`);
};

const registerTsAlias = (): void => {
    if (!fs.existsSync(TSCONFIG)) {
        console.warn(`[TypeScriptService] tsconfig not found at ${TSCONFIG}, skipping alias registration`);
        return;
    }

    const raw = fs.readFileSync(TSCONFIG, 'utf-8');
    const tsconfig = JSON.parse(raw);

    tsconfig.compilerOptions ??= {};
    tsconfig.compilerOptions.paths ??= {};

    const alias = '@api/*';
    const target = ['app/api/*'];

    const existing = tsconfig.compilerOptions.paths[alias];
    if (JSON.stringify(existing) === JSON.stringify(target)) return;

    tsconfig.compilerOptions.paths[alias] = target;

    fs.writeFileSync(TSCONFIG, JSON.stringify(tsconfig, null, 4), 'utf-8');
    console.log(`[TypeScriptService] Registered @api/* alias in ${TSCONFIG}`);
};

@Service()
export class TypeScriptService
{
    constructor()
    {
        fs.mkdirSync(API_DIR, { recursive: true });

        subscribe('services-loaded', async (services: unknown[]) => {

            const entityServices: ContentService<Content>[] = [];

            services.forEach(function(service: unknown) {
                if ((service as ContentService<Content>).isEntityService) {
                    entityServices.push(service as ContentService<Content>);
                }
            });

            writeFile(path.join(API_DIR, 'core-funcs.ts'), generateBase());

            for (const entityClass of getRegisteredEntities())
            {
                const entityName = Reflect.getMetadata(META.entity, entityClass);
                if (!entityName) continue;

                const fields = getEntityFields(entityClass);
                writeFile(path.join(API_DIR, `${entityName}.ts`), generateApi(entityName, fields));
            }

            registerTsAlias();

            return services;
        });
    }
}