import { get, search, loadMany } from './core-funcs';

export interface Documents {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    pageTitle?: unknown;
    pageDescription?: unknown;
    content?: unknown;
    parentPage?: unknown;
    keywords?: unknown;
    tags?: unknown;
}

const ENTITY = 'documents';
const SEARCHABLE = ['pageTitle', 'parentPage', 'keywords', 'tags'];

/** Load a single Documents by ID */
export const load = function(id: number): Promise<Documents> {
    return get<Documents>(ENTITY, id);
};

/** Load multiple Documents records by ID in parallel */
export const loadAll = function(ids: number[]): Promise<Documents[]> {
    return loadMany<Documents>(ENTITY, ids);
};

/** Search Documents records across: 'pageTitle', 'parentPage', 'keywords', 'tags' */
export const find = function(query: string, limit?: number): Promise<Documents[]> {
    return search<Documents>(ENTITY, query, SEARCHABLE, limit);
};