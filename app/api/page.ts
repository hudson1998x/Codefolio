import { get, search, loadMany } from './core-funcs';

export interface Page {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    pageTitle?: any;
    pageDescription?: any;
    content?: any;
}

const ENTITY = 'page';
const SEARCHABLE = ['pageTitle'];

/** Load a single Page by ID */
export const load = function(id: number): Promise<Page> {
    return get<Page>(ENTITY, id);
};

/** Load multiple Page records by ID in parallel */
export const loadAll = function(ids: number[]): Promise<Page[]> {
    return loadMany<Page>(ENTITY, ids);
};

/** Search Page records across: 'pageTitle' */
export const find = function(query: string, limit?: number): Promise<Page[]> {
    return search<Page>(ENTITY, query, SEARCHABLE, limit);
};