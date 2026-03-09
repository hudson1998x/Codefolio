import { fetchContent } from './../web/thirdparty/utils/fetch-content'

export const get = async <T>(entity: string, id: number): Promise<T> => {
    const res = await fetchContent(`/content/${entity}/${id}.json`);
    if (!res.ok) throw new Error(`Failed to load ${entity}#${id}: ${res.status}`);
    return res.json() as Promise<T>;
};

export const search = async <T>(
    entity: string,
    query: string,
    fields: string[],
    limit = 10
): Promise<T[]> => {
    const results: T[] = [];
    const q = query.toLowerCase();

    const res = await fetchContent(`/content/${entity}/index.ndjson`);
    if (!res.ok || !res.body) return [];

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
                const record = JSON.parse(trimmed);
                const matches = fields.some(field => {
                    const val = record[field];
                    return val && String(val).toLowerCase().includes(q);
                });
                if (matches) {
                    results.push(record as T);
                    if (results.length >= limit) break outer;
                }
            } catch { /* malformed line */ }
        }
    }

    return results;
};

export const loadMany = async <T>(entity: string, ids: number[]): Promise<T[]> =>
    Promise.all(ids.map(id => get<T>(entity, id)));