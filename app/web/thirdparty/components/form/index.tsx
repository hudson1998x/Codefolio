import React, { useRef, useState } from "react";
import { registerComponent, CodefolioProps } from "../registry";
import './style.scss'
import { fetchContent } from "../../utils/fetch-content";

/**
 * Configuration data for the Form component.
 */
export interface FormData {
  /**
   * The URL to which the form data is submitted as a JSON request.
   */
  endpoint: string;

  /**
   * The HTTP method used when submitting the form.
   * @default "POST"
   */
  method: string;

  /**
   * Additional CSS class name(s) to apply to the form element.
   */
  className: string;
}

/**
 * Parses a field `name` attribute with bracket notation into a path array.
 * Empty brackets `[]` are preserved as `"[]"` to signal array-push behaviour
 * in {@link setDeep}.
 *
 * @param name - The raw `name` attribute value (e.g. `"user[address][0]"` or `"tags[]"`).
 * @returns An ordered array of path segments (e.g. `["user", "address", "0"]` or `["tags", "[]"]`).
 */
const parseName = (name: string): string[] => {
  const parts: string[] = [];
  const pattern = /([^\[\]]+)|(\[\])/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(name)) !== null) {
    parts.push(match[0] === "[]" ? "[]" : match[0]);
  }
  return parts;
};

/**
 * Recursively sets a value at a nested path within an object.
 * Intermediate objects or arrays are created as needed based on the next segment:
 * a numeric string or `"[]"` signals an array; anything else signals a plain object.
 * An `"[]"` final segment pushes the value onto the current array rather than
 * assigning to a named key.
 *
 * @param obj   - The root object to mutate.
 * @param path  - Ordered path segments produced by {@link parseName}.
 * @param value - The value to set at the resolved path.
 */
const setDeep = (obj: Record<string, any>, path: string[], value: any): void => {
  let current = obj;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const nextKey = path[i + 1];

    // Array detection: is the next key a number or an explicit push marker?
    const isNextArray = nextKey === "[]" || /^\d+$/.test(nextKey);

    if (!current[key] || typeof current[key] !== "object") {
      current[key] = isNextArray ? [] : {};
    }

    current = current[key];
  }

  const lastKey = path[path.length - 1];
  
  if (lastKey === "[]") {
    if (Array.isArray(current)) current.push(value);
  } else {
    current[lastKey] = value;
  }
};

/**
 * Walks all `input`, `select`, and `textarea` elements within a form and
 * returns their values as a nested object, respecting bracket-notation names.
 *
 * - Checkboxes resolve to `boolean`.
 * - Number inputs resolve to `number`, or `null` when empty.
 * - Disabled fields and fields without a `name` are skipped.
 *
 * @param form - The `HTMLFormElement` to collect values from.
 * @returns A plain object whose shape mirrors the bracket-notation field names.
 */
const collectValues = (form: HTMLFormElement): Record<string, any> => {
  const values: Record<string, any> = {};
  const elements = form.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >("input, select, textarea");

  elements.forEach((el) => {
    if (!el.name || el.disabled) return;

    let value: any;
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      value = el.checked;
    } else if (el instanceof HTMLInputElement && el.type === "number") {
      value = el.value === "" ? null : Number(el.value);
    } else {
      value = el.value;
    }

    setDeep(values, parseName(el.name), value);
  });

  return values;
};

/**
 * Props for the {@link Form} component, extending the standard CMS data/children
 * shape with optional lifecycle callbacks.
 */
interface FormProps extends CodefolioProps<FormData> {
  /**
   * Called with the collected form values before the network request is made.
   * Return the (optionally mutated) values to proceed with submission, or
   * `null` to abort silently (e.g. after client-side validation failure).
   */
  onValues?: (values: Record<string, any>) => Promise<Record<string, any> | null>;

  /**
   * Called with the parsed JSON response body on a successful submission.
   * Receives `null` if the response body is not valid JSON.
   */
  onSuccess?: (response: any) => void;

  /**
   * Called with the thrown `Error` when the fetch fails or the server returns
   * a non-2xx status code.
   */
  onError?: (error: Error) => void;
}

/**
 * A headless JSON form that collects nested field values, optionally transforms
 * them, and submits them to a configurable endpoint.
 *
 * @remarks
 * Field names support full bracket notation (`user[address][city]`, `tags[]`) and
 * are serialised into a nested object before submission. The form renders a
 * transient status message for loading, success, and error states, and exposes
 * `data-state` on the `<form>` element for CSS-driven state styling.
 *
 * @example
 * ```tsx
 * <Form
 *   data={{ endpoint: "/api/profile", method: "PUT", className: "" }}
 *   onSuccess={(res) => console.log("Saved!", res)}
 *   onError={(err) => console.error(err)}
 * >
 *   <input name="user[name]" />
 *   <button type="submit">Save</button>
 * </Form>
 * ```
 */
const Form: React.FC<FormProps> = ({ data, children, onValues, onSuccess, onError }) => {
  const { endpoint, method = "POST", className = "" } = data;
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', msg?: string }>({ type: 'idle' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current || status.type === 'loading') return;

    setStatus({ type: 'loading', msg: 'Saving changes...' });

    try {
      let values = collectValues(formRef.current);

      if (onValues) {
        const processed = await onValues(values);
        if (processed === null) {
          setStatus({ type: 'idle' });
          return;
        };
        values = processed;
      }

      const res = await fetchContent(endpoint, {
        method: method.toUpperCase(),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const json = await res.json().catch(() => null);
      
      setStatus({ type: 'success', msg: 'Update successful!' });
      formRef.current.setAttribute("data-state", "success");
      onSuccess?.(json);

      // Reset message after 3 seconds
      setTimeout(() => setStatus({ type: 'idle' }), 3000);

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setStatus({ type: 'error', msg: error.message });
      formRef.current?.setAttribute("data-state", "error");
      onError?.(error);
    }
  };

  return (
    <form
      ref={formRef}
      className={`cf-form ${className} cf-form--${status.type}`.trim()}
      onSubmit={handleSubmit}
      noValidate
    >
      {children}
      
      {status.type !== 'idle' && (
        <div className={`cf-form__message cf-form__message--${status.type}`}>
          {status.msg}
        </div>
      )}
    </form>
  );
};

registerComponent({
  name: "Form",
  defaults: { endpoint: "", method: "POST", className: "" },
  component: Form as React.FC<any>,
  isCmsEditor: true,
  category: 'Forms'
});

export { Form };