import { get, search, loadMany } from './core-funcs';

export interface Skills {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    skillName?: unknown;
    skillCategory?: unknown;
    skillProficiency?: unknown;
    yearsOfExperience?: unknown;
    lastUsed?: unknown;
}

const ENTITY = 'skills';
const SEARCHABLE = ['skillName', 'skillCategory'];

/** Load a single Skills by ID */
export const load = (id: number): Promise<Skills> =>
    get<Skills>(ENTITY, id);

/** Load multiple Skills records by ID in parallel */
export const loadAll = (ids: number[]): Promise<Skills[]> =>
    loadMany<Skills>(ENTITY, ids);

/** Search Skills records across: 'skillName', 'skillCategory' */
export const find = (query: string, limit?: number): Promise<Skills[]> =>
    search<Skills>(ENTITY, query, SEARCHABLE, limit);