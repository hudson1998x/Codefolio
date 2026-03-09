import { fetchContent } from './../web/thirdparty/utils/fetch-content'

export async function get<T>(entity: string, id: number): Promise<T> {
    const res = await fetchContent(`/content/${entity}/${id}.json`);
    if (!res.ok) throw new Error(`Failed to load ${entity}#${id}: ${res.status}`);
    return res.json() as Promise<T>;
}

export async function search<T>(
    entity: string,
    query: string,
    fields: string[],
    limit: number = 10
): Promise<T[]> {

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
                const matches = fields.some(function(field) {
                    const val = record[field];
                    return val && String(val).toLowerCase().includes(q);
                });
                if (matches) {
                    results.push(record as T);
                    if (results.length >= limit) break outer;
                }
            } catch {}
        }
    }

    return results;
}

export async function loadMany<T>(entity: string, ids: number[]): Promise<T[]> {
    return Promise.all(ids.map(function(id) {
        return get<T>(entity, id);
    }));
}