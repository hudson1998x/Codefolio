import { get, search, loadMany } from './core-funcs';

export interface Certification {
    id: number;
    creator?: string;
    created?: string;
    updated?: string;
    certificationName?: unknown;
    issuer?: unknown;
    issueDate?: unknown;
    expiryDate?: unknown;
    credentialUrl?: unknown;
    credentialId?: unknown;
    skillIds?: unknown;
}

const ENTITY = 'certification';
const SEARCHABLE = ['certificationName', 'issuer'];

/** Load a single Certification by ID */
export const load = (id: number): Promise<Certification> =>
    get<Certification>(ENTITY, id);

/** Load multiple Certification records by ID in parallel */
export const loadAll = (ids: number[]): Promise<Certification[]> =>
    loadMany<Certification>(ENTITY, ids);

/** Search Certification records across: 'certificationName', 'issuer' */
export const find = (query: string, limit?: number): Promise<Certification[]> =>
    search<Certification>(ENTITY, query, SEARCHABLE, limit);