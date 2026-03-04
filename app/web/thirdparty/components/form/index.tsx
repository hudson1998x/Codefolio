import React, { useRef, useState } from "react";
import { registerComponent, CodefolioProps } from "../registry";
import './style.scss'

export interface FormData {
  endpoint: string;
  method: string;
  className: string;
}

/**
 * Parses bracket notation, including support for empty brackets [].
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
 * Deeply sets values. If the next segment is a number or "[]", 
 * it initializes an Array.
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

interface FormProps extends CodefolioProps<FormData> {
  onValues?: (values: Record<string, any>) => Promise<Record<string, any> | null>;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

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

      const res = await fetch(endpoint, {
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