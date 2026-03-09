import { get, search, loadMany } from './core-funcs';

export interface Achievements {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    achievementTitle?: any;
    issuer?: any;
    achievementType?: any;
    awardDate?: any;
    url?: any;
    description?: any;
}

const ENTITY = 'achievements';
const SEARCHABLE = ['achievementTitle', 'issuer', 'description'];

/** Load a single Achievements by ID */
export const load = function(id: number): Promise<Achievements> {
    return get<Achievements>(ENTITY, id);
};

/** Load multiple Achievements records by ID in parallel */
export const loadAll = function(ids: number[]): Promise<Achievements[]> {
    return loadMany<Achievements>(ENTITY, ids);
};

/** Search Achievements records across: 'achievementTitle', 'issuer', 'description' */
export const find = function(query: string, limit?: number): Promise<Achievements[]> {
    return search<Achievements>(ENTITY, query, SEARCHABLE, limit);
};