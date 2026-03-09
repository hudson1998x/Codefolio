import { get, search, loadMany } from './core-funcs';

export interface Education {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    institution?: unknown;
    institutionUrl?: unknown;
    qualificationType?: unknown;
    fieldOfStudy?: unknown;
    status?: unknown;
    startDate?: unknown;
    endDate?: unknown;
    grade?: unknown;
    description?: unknown;
    modules?: unknown;
    achievements?: unknown;
    skillIds?: unknown;
}

const ENTITY = 'education';
const SEARCHABLE = ['institution', 'institutionUrl', 'qualificationType', 'fieldOfStudy'];

/** Load a single Education by ID */
export const load = (id: number): Promise<Education> =>
    get<Education>(ENTITY, id);

/** Load multiple Education records by ID in parallel */
export const loadAll = (ids: number[]): Promise<Education[]> =>
    loadMany<Education>(ENTITY, ids);

/** Search Education records across: 'institution', 'institutionUrl', 'qualificationType', 'fieldOfStudy' */
export const find = (query: string, limit?: number): Promise<Education[]> =>
    search<Education>(ENTITY, query, SEARCHABLE, limit);