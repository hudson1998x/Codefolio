import { get, search, loadMany } from './core-funcs';

export interface Page {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    pageTitle?: unknown;
    pageDescription?: unknown;
    content?: unknown;
}

const ENTITY = 'page';
const SEARCHABLE = ['pageTitle'];

/** Load a single Page by ID */
export const load = (id: number): Promise<Page> =>
    get<Page>(ENTITY, id);

/** Load multiple Page records by ID in parallel */
export const loadAll = (ids: number[]): Promise<Page[]> =>
    loadMany<Page>(ENTITY, ids);

/** Search Page records across: 'pageTitle' */
export const find = (query: string, limit?: number): Promise<Page[]> =>
    search<Page>(ENTITY, query, SEARCHABLE, limit);