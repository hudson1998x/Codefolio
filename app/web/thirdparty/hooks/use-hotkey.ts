import { useEffect } from "react";

/**
 * A supported keyboard modifier key.
 * Maps directly to the corresponding `KeyboardEvent` boolean property.
 */
type ModifierKey = "ctrl" | "shift" | "alt" | "meta";

/**
 * A single element of a hotkey chord — either a {@link ModifierKey}
 * or any `KeyboardEvent.key` value (case-insensitive).
 */
type HotKey = ModifierKey | string;

/**
 * Registers a global `keydown` listener that fires `callback` when every key
 * in the `keys` chord is satisfied simultaneously.
 *
 * The `keys` array may contain any mix of {@link ModifierKey} values
 * (`"ctrl"`, `"shift"`, `"alt"`, `"meta"`) and regular key names matched
 * against `KeyboardEvent.key` (case-insensitive). When the chord matches,
 * `e.preventDefault()` is called before invoking `callback`.
 *
 * The listener is registered on `window` and removed automatically when the
 * component unmounts or when `keys` / `callback` change.
 *
 * @param keys - Ordered list of keys that must all be active for the chord to
 *   trigger. Modifiers and regular keys may appear in any order.
 * @param callback - Handler invoked with the original `KeyboardEvent` when
 *   the full chord is matched.
 *
 * @example
 * ```ts
 * // Focus a search input on ⌘K / Ctrl+K
 * useHotKey(['meta', 'k'], () => searchRef.current?.focus());
 * useHotKey(['ctrl', 'k'], () => searchRef.current?.focus());
 *
 * // Trigger a save on Ctrl+Shift+S
 * useHotKey(['ctrl', 'shift', 's'], () => handleSave());
 * ```
 */
export function useHotKey(keys: HotKey[], callback: (e: KeyboardEvent) => void) {
  useEffect(() => {
    /**
     * Maps each {@link ModifierKey} string to its corresponding
     * `KeyboardEvent` property name for fast boolean lookup.
     */
    const modifiers: Record<ModifierKey, keyof KeyboardEvent> = {
      ctrl: "ctrlKey",
      shift: "shiftKey",
      alt: "altKey",
      meta: "metaKey",
    };

    const modifierSet = new Set<string>(["ctrl", "shift", "alt", "meta"]);

    /** Modifier portion of the chord (e.g. `["ctrl", "shift"]`). */
    const requiredModifiers = keys.filter((k) => modifierSet.has(k)) as ModifierKey[];

    /** Non-modifier portion of the chord (e.g. `["k"]`). */
    const regularKeys = keys.filter((k) => !modifierSet.has(k));

    /**
     * `keydown` handler attached to `window`.
     * Checks modifier state via `KeyboardEvent` boolean flags and compares
     * each regular key against `e.key` case-insensitively.
     *
     * @param e - The native keyboard event.
     */
    const handler = (e: KeyboardEvent) => {
      const modifiersMatch = requiredModifiers.every((mod) => e[modifiers[mod]]);
      const keysMatch = regularKeys.every((k) => e.key.toLowerCase() === k.toLowerCase());

      if (modifiersMatch && keysMatch) {
        e.preventDefault();
        callback(e);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keys, callback]);
}