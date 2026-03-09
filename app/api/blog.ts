import { get, search, loadMany } from './core-funcs';

export interface Blog {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    pageTitle?: unknown;
    content?: unknown;
    keywords?: unknown;
    pageDescription?: unknown;
    category?: unknown;
    tags?: unknown;
}

const ENTITY = 'blog';
const SEARCHABLE = ['pageTitle', 'keywords'];

/** Load a single Blog by ID */
export const load = (id: number): Promise<Blog> =>
    get<Blog>(ENTITY, id);

/** Load multiple Blog records by ID in parallel */
export const loadAll = (ids: number[]): Promise<Blog[]> =>
    loadMany<Blog>(ENTITY, ids);

/** Search Blog records across: 'pageTitle', 'keywords' */
export const find = (query: string, limit?: number): Promise<Blog[]> =>
    search<Blog>(ENTITY, query, SEARCHABLE, limit);