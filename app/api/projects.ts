import { get, search, loadMany } from './core-funcs';

export interface Projects {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    projectTitle?: any;
    projectDescription?: any;
    repositoryUrl?: any;
    publishedUrl?: any;
    tags?: any;
    category?: any;
    skillIds?: any;
    documentationUrl?: any;
}

const ENTITY = 'projects';
const SEARCHABLE = ['projectTitle', 'projectDescription', 'tags'];

/** Load a single Projects by ID */
export const load = function(id: number): Promise<Projects> {
    return get<Projects>(ENTITY, id);
};

/** Load multiple Projects records by ID in parallel */
export const loadAll = function(ids: number[]): Promise<Projects[]> {
    return loadMany<Projects>(ENTITY, ids);
};

/** Search Projects records across: 'projectTitle', 'projectDescription', 'tags' */
export const find = function(query: string, limit?: number): Promise<Projects[]> {
    return search<Projects>(ENTITY, query, SEARCHABLE, limit);
};