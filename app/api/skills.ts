import { get, search, loadMany } from './core-funcs';

export interface Skills {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    skillName?: any;
    skillCategory?: any;
    skillProficiency?: any;
    yearsOfExperience?: any;
    lastUsed?: any;
}

const ENTITY = 'skills';
const SEARCHABLE = ['skillName', 'skillCategory'];

/** Load a single Skills by ID */
export const load = function(id: number): Promise<Skills> {
    return get<Skills>(ENTITY, id);
};

/** Load multiple Skills records by ID in parallel */
export const loadAll = function(ids: number[]): Promise<Skills[]> {
    return loadMany<Skills>(ENTITY, ids);
};

/** Search Skills records across: 'skillName', 'skillCategory' */
export const find = function(query: string, limit?: number): Promise<Skills[]> {
    return search<Skills>(ENTITY, query, SEARCHABLE, limit);
};