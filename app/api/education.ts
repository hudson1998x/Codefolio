import { get, search, loadMany } from './core-funcs';

export interface Education {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    institution?: any;
    institutionUrl?: any;
    qualificationType?: any;
    fieldOfStudy?: any;
    status?: any;
    startDate?: any;
    endDate?: any;
    grade?: any;
    description?: any;
    modules?: any;
    achievements?: any;
    skillIds?: any;
}

const ENTITY = 'education';
const SEARCHABLE = ['institution', 'institutionUrl', 'qualificationType', 'fieldOfStudy'];

/** Load a single Education by ID */
export const load = function(id: number): Promise<Education> {
    return get<Education>(ENTITY, id);
};

/** Load multiple Education records by ID in parallel */
export const loadAll = function(ids: number[]): Promise<Education[]> {
    return loadMany<Education>(ENTITY, ids);
};

/** Search Education records across: 'institution', 'institutionUrl', 'qualificationType', 'fieldOfStudy' */
export const find = function(query: string, limit?: number): Promise<Education[]> {
    return search<Education>(ENTITY, query, SEARCHABLE, limit);
};