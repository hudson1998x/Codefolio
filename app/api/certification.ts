import { get, search, loadMany } from './core-funcs';

export interface Certification {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    certificationName?: any;
    issuer?: any;
    issueDate?: any;
    expiryDate?: any;
    credentialUrl?: any;
    credentialId?: any;
    skillIds?: any;
}

const ENTITY = 'certification';
const SEARCHABLE = ['certificationName', 'issuer'];

/** Load a single Certification by ID */
export const load = function(id: number): Promise<Certification> {
    return get<Certification>(ENTITY, id);
};

/** Load multiple Certification records by ID in parallel */
export const loadAll = function(ids: number[]): Promise<Certification[]> {
    return loadMany<Certification>(ENTITY, ids);
};

/** Search Certification records across: 'certificationName', 'issuer' */
export const find = function(query: string, limit?: number): Promise<Certification[]> {
    return search<Certification>(ENTITY, query, SEARCHABLE, limit);
};