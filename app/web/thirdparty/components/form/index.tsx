import React, { useRef } from "react";
import { registerComponent, CodefolioProps } from "../registry";

/**
 * The data shape stored in a {@link CanvasNode} when the `"Form"`
 * component is used in a content tree.
 */
export interface FormData {
  /** The API endpoint to submit the form values to. */
  endpoint: string;
  /** The HTTP method to use when submitting. @defaultValue `"POST"` */
  method: string;
  /** Optional CSS class names applied to the `<form>` root element. */
  className: string;
}

/**
 * Parses a bracket-notation field name into its path segments.
 *
 * @example
 * "user[name]"          → ["user", "name"]
 * "user[address][city]" → ["user", "address", "city"]
 * "siteTitle"           → ["siteTitle"]
 *
 * @internal
 */
const parseName = (name: string): string[] => {
  const parts: string[] = [];
  const pattern = /([^\[\]]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(name)) !== null) {
    parts.push(match[1]);
  }
  return parts;
};

/**
 * Sets a deeply nested value on an object using an array of path segments.
 *
 * @example
 * setDeep({}, ["user", "name"], "Jane") → { user: { name: "Jane" } }
 *
 * @internal
 */
const setDeep = (obj: Record<string, any>, path: string[], value: any): void => {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }
  current[path[path.length - 1]] = value;
};

/**
 * Collects all descendant inputs, selects, and textareas from a form
 * element and builds a nested JSON object from their `name` attributes.
 *
 * Bracket notation names are parsed into nested objects:
 * - `"user[name]"` → `{ user: { name: "..." } }`
 * - `"user[address][city]"` → `{ user: { address: { city: "..." } } }`
 * - `"siteTitle"` → `{ siteTitle: "..." }`
 *
 * Elements without a `name` attribute are silently skipped.
 *
 * @param form - The `<form>` DOM element to collect values from.
 * @returns A deeply nested record built from bracket-notation field names.
 * @internal
 */
const collectValues = (form: HTMLFormElement): Record<string, any> => {
  const values: Record<string, any> = {};

  const elements = form.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >("input, select, textarea");

  elements.forEach((el) => {
    if (!el.name) return;

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

interface FormProps extends CodefolioProps<FormData> {
  /**
   * Called with the collected values before the request is made.
   * Return the (optionally transformed) values to send, or `null`
   * to abort the submission entirely.
   */
  onValues?:  (values: Record<string, any>) => Promise<Record<string, any> | null>;
  /** Called with the parsed JSON response on a successful request. */
  onSuccess?: (response: any) => void;
  /** Called with the error on a failed request or non-OK response. */
  onError?:   (error: Error) => void;
}

/**
 * A canvas-aware form wrapper that captures descendant input values,
 * builds a nested JSON payload from bracket-notation field names, and
 * submits the result to a configured API endpoint.
 *
 * @remarks
 * Values are collected by querying the DOM directly, so inputs can live
 * at any depth inside child {@link CanvasNode} components without needing
 * to report their values upward.
 *
 * `data-state` is set to `"success"` or `"error"` on the form root after
 * each submission attempt, giving themes a CSS hook for feedback styling.
 *
 * @example
 * ```json
 * {
 *   "component": "Form",
 *   "data": { "endpoint": "/api/config/update", "method": "POST", "className": "" },
 *   "children": [
 *     {
 *       "component": "Input",
 *       "data": { "name": "footer[copyrightName]", "label": "Copyright Name", "kind": "input", "type": "text" },
 *       "children": []
 *     }
 *   ]
 * }
 * ```
 *
 * Submits:
 * ```json
 * { "footer": { "copyrightName": "My Portfolio" } }
 * ```
 */
const Form: React.FC<FormProps> = ({ data, children, onValues, onSuccess, onError }) => {
  const { endpoint, method = "POST", className = "" } = data;
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;

    try {
      let values = collectValues(formRef.current);

      if (onValues) {
        const processed = await onValues(values);
        if (processed === null) return;
        values = processed;
      }

      const res = await fetch(endpoint, {
        method:  method.toUpperCase(),
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(values),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}: ${res.statusText}`);
      }

      const json = await res.json().catch(() => null);
      formRef.current.setAttribute("data-state", "success");
      onSuccess?.(json);

    } catch (err) {
      formRef.current?.setAttribute("data-state", "error");
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return (
    <form
      ref={formRef}
      className={`cf-form ${className}`.trim()}
      onSubmit={handleSubmit}
      noValidate
    >
      {children}
    </form>
  );
};

registerComponent({
  name:     "Form",
  defaults: {
    endpoint:  "",
    method:    "POST",
    className: "",
  },
  component: Form as React.FC<any>,
  isCmsEditor: true,
  category: 'Forms'
});

export { Form };