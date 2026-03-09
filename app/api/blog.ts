import { get, search, loadMany } from './core-funcs';

export interface Blog {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    pageTitle?: any;
    content?: any;
    keywords?: any;
    pageDescription?: any;
    category?: any;
    tags?: any;
}

const ENTITY = 'blog';
const SEARCHABLE = ['pageTitle', 'keywords'];

/** Load a single Blog by ID */
export const load = function(id: number): Promise<Blog> {
    return get<Blog>(ENTITY, id);
};

/** Load multiple Blog records by ID in parallel */
export const loadAll = function(ids: number[]): Promise<Blog[]> {
    return loadMany<Blog>(ENTITY, ids);
};

/** Search Blog records across: 'pageTitle', 'keywords' */
export const find = function(query: string, limit?: number): Promise<Blog[]> {
    return search<Blog>(ENTITY, query, SEARCHABLE, limit);
};