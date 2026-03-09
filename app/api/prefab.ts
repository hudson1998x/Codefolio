import { get, search, loadMany } from './core-funcs';

export interface Prefab {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    prefabName?: any;
    prefabJson?: any;
    category?: any;
}

const ENTITY = 'prefab';
const SEARCHABLE = ['prefabName', 'category'];

/** Load a single Prefab by ID */
export const load = function(id: number): Promise<Prefab> {
    return get<Prefab>(ENTITY, id);
};

/** Load multiple Prefab records by ID in parallel */
export const loadAll = function(ids: number[]): Promise<Prefab[]> {
    return loadMany<Prefab>(ENTITY, ids);
};

/** Search Prefab records across: 'prefabName', 'category' */
export const find = function(query: string, limit?: number): Promise<Prefab[]> {
    return search<Prefab>(ENTITY, query, SEARCHABLE, limit);
};