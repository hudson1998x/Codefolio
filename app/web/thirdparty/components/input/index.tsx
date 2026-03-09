import React, { useState, useRef, useEffect, useId } from "react";
import { registerComponent, CodefolioProps } from "../registry";
import './style.scss'
import './custom/prefab-editor'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/**
 * A single option within a {@link SelectField} or searchable dropdown.
 */
export interface InputOption {
  /** The value submitted / passed to `onChange`. */
  value: string;
  /** The human-readable label displayed in the dropdown. */
  label: string;
}

/**
 * A validation rule applied to the field value on change and on blur.
 */
export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

// ─────────────────────────────────────────────
// Shared base props
// ─────────────────────────────────────────────

interface BaseFieldProps {
  /** The `name` attribute submitted with the form — supports bracket notation e.g. `"footer[copyrightName]"`. */
  name?: string;
  /** Label rendered above the field. */
  label: string;
  /** Initial value. The component is uncontrolled by default. */
  defaultValue?: string;
  /** Called with the current value whenever it changes. */
  onChange?: (value: string) => void;
  /** One or more validation rules evaluated on every change and on blur. */
  validate?: ValidationRule[];
  /** Marks the field as required — shorthand for a non-empty validation rule. */
  required?: boolean;
  /** Disables the field. */
  disabled?: boolean;
  /** Placeholder text shown when the field is empty. */
  placeholder?: string;
}

// ─────────────────────────────────────────────
// Variant-specific props
// ─────────────────────────────────────────────

interface TextFieldProps extends BaseFieldProps {
  kind: "input";
  /** Any valid HTML `<input>` type. Defaults to `"text"`. */
  type?: React.HTMLInputTypeAttribute;
}

interface TextAreaFieldProps extends BaseFieldProps {
  kind: "textarea";
  /** Number of visible text rows. Defaults to `4`. */
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  kind: "select";
  /** The list of options to display in the searchable dropdown. */
  options: InputOption[];
}

/**
 * Discriminated union of all supported field variants.
 */
export type FieldProps = TextFieldProps | TextAreaFieldProps | SelectFieldProps;

/**
 * The data shape stored in a {@link CanvasNode} when the `"Input"` component
 * is used in a content tree.
 */
export interface FieldData {
  /** The `name` attribute — supports bracket notation e.g. `"footer[copyrightName]"`. */
  name: string;
  /** Determines which input variant to render. Defaults to `"input"`. */
  kind: "input" | "textarea" | "select";
  /** Label rendered above the field. */
  label: string;
  /** Seed value for the field on first render. */
  defaultValue: string;
  /** Placeholder text shown when the field is empty. */
  placeholder: string;
  /** HTML input type — only applicable when `kind` is `"input"`. */
  type: string;
  /** Number of visible rows — only applicable when `kind` is `"textarea"`. */
  rows: number;
  /** Whether the field must be non-empty before the form can be submitted. */
  required: boolean;
  /** Whether the field is non-interactive. */
  disabled: boolean;
  /**
   * Options for the searchable select — only applicable when `kind` is
   * `"select"`. Each entry is a `"value:label"` string split at the first
   * colon.
   */
  options: string[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const runValidation = (
  value: string,
  rules: ValidationRule[] = [],
  required?: boolean
): string | null => {
  if (required && !value.trim()) return "This field is required.";
  for (const rule of rules) {
    if (!rule.validate(value)) return rule.message;
  }
  return null;
};

const parseOptions = (raw: string[]): InputOption[] =>{
  if ((raw[0] as unknown as InputOption)?.label)
  {
    return raw as unknown as InputOption[];
  }

  return raw.map(entry => {
    const idx = entry.indexOf(":");
    if (idx === -1) return { value: entry, label: entry };
    return { value: entry.slice(0, idx), label: entry.slice(idx + 1) };
  });
}

const fieldDataToProps = (data: FieldData): FieldProps => {
  const base: BaseFieldProps = {
    name:         data.name         ?? "",
    label:        data.label        ?? "Field",
    defaultValue: data.defaultValue ?? "",
    placeholder:  data.placeholder  ?? "",
    required:     data.required     ?? false,
    disabled:     data.disabled     ?? false,
  };

  if (data.kind === "select") {
    return { ...base, kind: "select", options: parseOptions(data.options ?? []) };
  }

  if (data.kind === "textarea") {
    return { ...base, kind: "textarea", rows: data.rows ?? 4 };
  }

  return { ...base, kind: "input", type: data.type ?? "text" };
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

interface WrapperProps {
  id: string;
  label: string;
  error: string | null;
  children: React.ReactNode;
}

const FieldWrapper: React.FC<WrapperProps> = ({ id, label, error, children }) => (
  <div className="cf-field">
    <label className="cf-label" htmlFor={id}>{label}</label>
    {children}
    {error && <span className="cf-error" role="alert">{error}</span>}
  </div>
);

// ─────────────────────────────────────────────
// Searchable Select
// ─────────────────────────────────────────────

interface SearchableSelectProps {
  id: string;
  options: InputOption[];
  value: string;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  options,
  value,
  placeholder = "Select...",
  disabled,
  name,
  onChange,
  onBlur,
}) => {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [focused, setFocused] = useState(-1);
  const containerRef          = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        onBlur();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onBlur]);

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setFocused(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = (option: InputOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === "Enter" || e.key === " ") handleOpen(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocused(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocused(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && focused >= 0) { handleSelect(filtered[focused]); }
    if (e.key === "Escape") { setOpen(false); setQuery(""); onBlur(); }
  };

  return (
    <div
      ref={containerRef}
      className={`cf-select ${open ? "cf-select--open" : ""} ${disabled ? "cf-select--disabled" : ""}`}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={`${id}-listbox`}
      onClick={handleOpen}
    >
      <input type={'hidden'} name={name} value={value}/>
      <div className="cf-select__trigger">
        <span className={`cf-select__value ${!selected ? "cf-select__value--placeholder" : ""}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="cf-select__chevron" aria-hidden>▾</span>
      </div>

      {open && (
        <div className="cf-select__dropdown" role="listbox" id={`${id}-listbox`}>
          <div className="cf-select__search">
            <input
              ref={inputRef}
              className="cf-select__search-input"
              value={query}
              onChange={e => { setQuery(e.target.value); setFocused(-1); }}
              onClick={e => e.stopPropagation()}
              placeholder="Search..."
              aria-label="Search options"
            />
          </div>

          <ul className="cf-select__options">
            {filtered.length === 0 && (
              <li className="cf-select__empty">No results found.</li>
            )}
            {filtered.map((option, idx) => (
              <li
                key={option.value}
                className={[
                  "cf-select__option",
                  option.value === value ? "cf-select__option--selected" : "",
                  idx === focused        ? "cf-select__option--focused"  : "",
                ].join(" ")}
                role="option"
                aria-selected={option.value === value}
                onMouseDown={e => { e.preventDefault(); handleSelect(option); }}
                onMouseEnter={() => setFocused(idx)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Field component — standalone usage
// ─────────────────────────────────────────────

export const Field: React.FC<FieldProps> = (props) => {
  const { name, label, defaultValue = "", onChange, validate, required, disabled, placeholder } = props;

  const id                    = useId();
  const [value, setValue]     = useState(defaultValue);
  const [touched, setTouched] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleChange = (next: string) => {
    setValue(next);
    const err = runValidation(next, validate, required);
    if (touched) setError(err);
    onChange?.(next);
  };

  const handleBlur = () => {
    setTouched(true);
    setError(runValidation(value, validate, required));
  };

  if (props.kind === "select") {
    return (
      <FieldWrapper id={id} label={label} error={touched ? error : null}>
        <SearchableSelect
          id={id}
          options={props.options}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleChange}
          onBlur={handleBlur}
          name={props.name}
        />
      </FieldWrapper>
    );
  }

  if (props.kind === "textarea") {
    return (
      <FieldWrapper id={id} label={label} error={touched ? error : null}>
        <textarea
          id={id}
          name={name}
          className={`cf-input cf-textarea ${touched && error ? "cf-input--error" : ""}`}
          value={value}
          rows={props.rows ?? 4}
          placeholder={placeholder}
          disabled={disabled}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
        />
      </FieldWrapper>
    );
  }

  return (
    <FieldWrapper id={id} label={label} error={touched ? error : null}>
      <input
        id={id}
        name={name}
        className={`cf-input ${touched && error ? "cf-input--error" : ""}`}
        type={props.type ?? "text"}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e => handleChange(e.target.value)}
        onBlur={handleBlur}
      />
    </FieldWrapper>
  );
};

// ─────────────────────────────────────────────
// Canvas adapter — registry usage
// ─────────────────────────────────────────────

const FieldCanvas: React.FC<CodefolioProps<FieldData>> = ({ data }) => {
  return <Field {...fieldDataToProps(data)} />;
};

// ─────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────

const fieldDefaults: FieldData = {
  name:         "",
  kind:         "input",
  label:        "Label",
  defaultValue: "",
  placeholder:  "Enter a value...",
  type:         "text",
  rows:         4,
  required:     false,
  disabled:     false,
  options:      [],
};

registerComponent({
  name:      "Input",
  defaults:  fieldDefaults,
  component: FieldCanvas,
  isCmsEditor: true,
  category: 'Forms'
});