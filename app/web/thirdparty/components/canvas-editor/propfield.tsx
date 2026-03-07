import { PrefabEditor } from "@components/input/custom/prefab-editor";
import { LinkPicker } from "@components/link/picker";
import { FieldMeta } from "@components/registry";
import { PageSearchPicker } from "app/web/themes/@admin/components/page-picker";
import { ImageUploader } from "app/web/themes/@admin/pages/media-gallery/image-miniselector";
import { useState, useEffect, useRef } from "react";

export const PropField: React.FC<{
  propKey: string;
  value: any;
  meta?: FieldMeta;
  onChange: (val: any) => void;
}> = ({ propKey, value, meta, onChange }) => {
  const label = meta?.label || propKey.replace(/([A-Z])/g, " $1").trim();
  const type = meta?.type || "text";
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Track whether this component is still mounted for the current node.
  // If onChange fires after unmount/remount (stale closure), we discard it.
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const safeOnChange = (val: any) => {
    if (isMounted.current) onChange(val);
  };

  const handleJsonChange = (val: string) => {
    try {
      if (val && typeof val === "string" && val.trim() !== "") {
        const parsed = JSON.parse(val);
        // Only propagate valid parsed JSON upward, never a raw invalid string
        safeOnChange(parsed);
      } else {
        safeOnChange(val);
      }
      setJsonError(null);
    } catch (e: any) {
      // Don't call onChange at all while JSON is invalid — 
      // this prevents half-typed input from corrupting node data
      setJsonError(e.message);
    }
  };

  const renderField = () => {

    if (type === "image-uploader") {
      return <ImageUploader value={value} onChange={safeOnChange} />;
    }

    if (type === "prefab-editor") {
      return <PrefabEditor value={value} onChange={safeOnChange} />;
    }

    if (type === "page-picker") {
      return <LinkPicker value={value} onChange={safeOnChange} />;
    }

    if (type === "select" && meta?.options) {
      return (
        <select value={value || ""} onChange={(e) => safeOnChange(e.target.value)}>
          {meta.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (type === "textarea") {
      return (
        <textarea
          value={value || ""}
          onChange={(e) => safeOnChange(e.target.value)}
          rows={6}
        />
      );
    }

    if (type === "json") {
      // Keep a local display string so the textarea stays editable while JSON is invalid,
      // but we never push invalid JSON upstream
      const displayValue = typeof value === "string"
        ? value
        : JSON.stringify(value, null, 2);

      return (
        <div className="json-field">
          <textarea
            className={`json-field__textarea ${jsonError ? "has-error" : "is-valid"}`}
            value={displayValue}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={10}
            spellCheck={false}
          />
          {jsonError && <div className="json-error">{jsonError}</div>}
        </div>
      );
    }

    if (type === "boolean") {
      const isActive = value === "true" || value === true;
      return (
        <div className="toggle-wrap">
          <button
            type="button"
            className={`toggle ${isActive ? "active" : ""}`}
            onClick={() => safeOnChange(!isActive ? "true" : "false")}
          >
            <span className="toggle-thumb" />
          </button>
          <span className="toggle-label">{isActive ? "On" : "Off"}</span>
        </div>
      );
    }

    // Default fallback (text input)
    return (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => safeOnChange(e.target.value)}
      />
    );
  };

  return (
    <div className="field-group">
      <label>{label}</label>
      {renderField()}
    </div>
  );
};