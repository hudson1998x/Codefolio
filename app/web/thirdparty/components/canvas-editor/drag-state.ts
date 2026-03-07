/**
 * Module-level drag state store.
 * Bypasses dataTransfer entirely — no browser security restrictions,
 * no data wiping, works reliably regardless of what elements the drag
 * passes over.
 */

export type DragPayload =
  | { type: 'node'; dragId: string }
  | { type: 'component'; name: string; prefabData?: any };

let current: DragPayload | null = null;

export const DragState = {
  set(payload: DragPayload) {
    current = payload;
  },
  get(): DragPayload | null {
    return current;
  },
  clear() {
    current = null;
  },
};