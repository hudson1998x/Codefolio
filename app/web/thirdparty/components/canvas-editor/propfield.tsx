import { PrefabEditor } from "@components/input/custom/prefab-editor";
import { LinkPicker } from "@components/link/picker";
import { FieldMeta } from "@components/registry";
import { PageSearchPicker } from "app/web/themes/@admin/components/page-picker";
import { ImageUploader } from "app/web/themes/@admin/pages/media-gallery/image-miniselector";
import { useState } from "react";

export const PropField: React.FC<{
  propKey: string;
  value: any;
  meta?: FieldMeta;
  onChange: (val: any) => void;
}> = ({ propKey, value, meta, onChange }) => {
  const label = meta?.label || propKey.replace(/([A-Z])/g, " $1").trim();
  const type = meta?.type || "text";
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (val: string) => {
    onChange(val);
    try {
      if (val && typeof val === "string" && val.trim() !== "") {
        JSON.parse(val);
      }
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const renderField = () => {

    if (type === "image-uploader")
    {
      return <ImageUploader value={value} onChange={onChange}/>
    }

    if (type === "prefab-editor") {
      return <PrefabEditor value={value} onChange={handleJsonChange} />;
    }

    // Inside PropField.tsx renderField logic:
    if (type === 'page-picker') {
    return <LinkPicker value={value} onChange={onChange} />;
    }

    if (type === "select" && meta?.options) {
      return (
        <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
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
          onChange={(e) => onChange(e.target.value)}
          rows={6}
        />
      );
    }

    if (type === "json") {
      return (
        <div className="json-field">
          <textarea
            className={`json-field__textarea ${jsonError ? "has-error" : "is-valid"}`}
            value={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
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
            onClick={() => onChange(!isActive ? "true" : "false")}
          >
            <span className="toggle-thumb" />
          </button>
          <span className="toggle-label">{isActive ? "On" : "Off"}</span>
        </div>
      );
    }

    // Default Fallback (text input)
    return (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
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