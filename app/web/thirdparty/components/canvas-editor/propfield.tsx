import { PrefabEditor } from "@components/input/custom/prefab-editor";
import { FieldMeta } from "@components/registry";
import { useState } from "react";

export const PropField: React.FC<{
  propKey: string;
  value: any;
  meta?: FieldMeta;
  onChange: (val: any) => void;
}> = ({ propKey, value, meta, onChange }) => {
  const label = meta?.label || propKey.replace(/([A-Z])/g, ' $1').trim();
  const type = meta?.type || 'text';
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (val: string) => {
    onChange(val);
    try {
      if (val && typeof val === 'string' && val.trim() !== '') {
        JSON.parse(val);
      }
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  return (
    <div className="field-group">
      <label>{label}</label>

      {type === 'prefab-editor' ? (
        <PrefabEditor value={value} onChange={(e) => handleJsonChange(e)} />
      ) : type === 'select' && meta?.options ? (
        <select value={value || ""} onChange={e => onChange(e.target.value)}>
          {meta.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          rows={6}
        />
      ) : type === 'json' ? (
        <div className="json-field">
          <textarea
            className={`json-field__textarea ${jsonError ? 'has-error' : 'is-valid'}`}
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={e => handleJsonChange(e.target.value)}
            rows={10}
            spellCheck={false}
          />
          {jsonError && <div className="json-error">{jsonError}</div>}
        </div>
      ) : type === 'boolean' ? (
        <div className="toggle-wrap">
          <button
            type="button"
            className={`toggle ${value === 'true' ? 'active' : ''}`}
            onClick={() => onChange(value === 'true' ? 'false' : 'true')}
          >
            <span className="toggle-thumb" />
          </button>
          <span className="toggle-label">{value === 'true' ? 'On' : 'Off'}</span>
        </div>
      ) : (
        <input
          type="text"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  );
};