import { get, search, loadMany } from './core-funcs';

export interface Achievements {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    achievementTitle?: unknown;
    issuer?: unknown;
    achievementType?: unknown;
    awardDate?: unknown;
    url?: unknown;
    description?: unknown;
}

const ENTITY = 'achievements';
const SEARCHABLE = ['achievementTitle', 'issuer', 'description'];

/** Load a single Achievements by ID */
export const load = (id: number): Promise<Achievements> =>
    get<Achievements>(ENTITY, id);

/** Load multiple Achievements records by ID in parallel */
export const loadAll = (ids: number[]): Promise<Achievements[]> =>
    loadMany<Achievements>(ENTITY, ids);

/** Search Achievements records across: 'achievementTitle', 'issuer', 'description' */
export const find = (query: string, limit?: number): Promise<Achievements[]> =>
    search<Achievements>(ENTITY, query, SEARCHABLE, limit);