import { useEffect, useMemo } from "react";
import { CanvasEditor } from '@components/canvas-editor'

/**
 * PrefabEditor
 * * @remarks
 * This is the custom field editor for the `prefabJson` property.
 * It wraps a CanvasEditor to provide a visual way to build the template.
 */
export const PrefabEditor: React.FC<{ 
  value: any; 
  onChange: (val: string) => void 
}> = ({ value, onChange }) => {
  // Ensure the value is a stringified JSON for the nested CanvasEditor
  const stringifiedValue = useMemo(() => {
    if (typeof value === 'string') return value;
    return JSON.stringify(value || []);
  }, [value]);

  useEffect(() => {
    onChange(stringifiedValue);
  }, [stringifiedValue])

  

  return (
    <div className="prefab-field-editor">
      <div className="prefab-field-editor__help">
        Editing Nested Template Structure:
      </div>
      <CanvasEditor 
        data={{
          name: "nested-prefab-content",
          value: stringifiedValue,
          // @ts-ignore type error, will be upcoming in future commits.
          label: "Template Designer"
        }}
        onChange={onChange}
      />
      <div className="prefab-field-editor__notice">
        Note: Changes inside the designer update the Prefab JSON field.
      </div>
    </div>
  );
};