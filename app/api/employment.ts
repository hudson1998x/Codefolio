import { get, search, loadMany } from './core-funcs';

export interface Employment {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    company?: unknown;
    companyUrl?: unknown;
    industry?: unknown;
    companySize?: unknown;
    roleTitle?: unknown;
    roleType?: unknown;
    department?: unknown;
    location?: unknown;
    startDate?: unknown;
    endDate?: unknown;
    summary?: unknown;
    achievements?: unknown;
    responsibilities?: unknown;
    skillsUsed?: unknown;
}

const ENTITY = 'employment';
const SEARCHABLE = ['company', 'companyUrl', 'industry', 'roleTitle'];

/** Load a single Employment by ID */
export const load = function(id: number): Promise<Employment> {
    return get<Employment>(ENTITY, id);
};

/** Load multiple Employment records by ID in parallel */
export const loadAll = function(ids: number[]): Promise<Employment[]> {
    return loadMany<Employment>(ENTITY, ids);
};

/** Search Employment records across: 'company', 'companyUrl', 'industry', 'roleTitle' */
export const find = function(query: string, limit?: number): Promise<Employment[]> {
    return search<Employment>(ENTITY, query, SEARCHABLE, limit);
};