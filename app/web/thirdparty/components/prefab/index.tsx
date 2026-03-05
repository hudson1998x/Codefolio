import React, { useMemo } from "react";
import { registerComponent } from "../registry";
import { Canvas } from "@components/canvas-editor/canvas";

/**
 * Prefab Component
 * * @remarks
 * This is a "Meta-Component". Instead of rendering a specific UI element,
 * it receives a CanvasNode tree via the `prefabJson` prop and passes it
 * back into the recursive Canvas renderer.
 */
export const Prefab: React.FC<{ data: any }> = ({ data }) => {
  const nodes = useMemo(() => {
    // 1. Check for live overrides from the editor first
    const raw = data?.prefabJson; 
    
    if (!raw) return [];

    // 2. Handle parsing if the editor passes a string, or use object if already parsed
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      console.error("Prefab: Parse Error", e);
      return [];
    }
  }, [data?.prefabJson]);

  return (
    <div className="codefolio-prefab-render">
      <Canvas manualNodes={nodes} />
    </div>
  );
};

registerComponent({
  name: "Prefab",
  defaults: {
    prefabName: '',
    prefabJson: [], // Ensure this starts as an array
  },
  fields: {
    prefabName: { type: 'text', label: 'Template Name' },
    // This tells PropField to use Case 1 (the PrefabEditor)
    prefabJson: { type: 'prefab-editor', label: 'Prefab Structure' }, 
  },
  component: Prefab,
  isCmsEditor: true,
});