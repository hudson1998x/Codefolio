import { PageSearchPicker } from "app/web/themes/@admin/components/page-picker";
import React, { useState, useEffect } from "react";

interface LinkPickerProps {
  value: string;
  onChange: (val: string) => void;
}

export const LinkPicker: React.FC<LinkPickerProps> = ({ value, onChange }) => {
  // Infer initial mode: if it starts with http or doesn't look like /page/x, it's external
  const isInitialExternal = value.startsWith('http') || (value && !value.startsWith('/page/'));
  const [mode, setMode] = useState<'internal' | 'external'>(isInitialExternal ? 'external' : 'internal');

  return (
    <div className="cf-link-picker">
      <div className="cf-link-picker__tabs">
        <button 
          type="button"
          className={mode === 'internal' ? 'active' : ''} 
          onClick={() => setMode('internal')}
        >
          Internal Page
        </button>
        <button 
          type="button"
          className={mode === 'external' ? 'active' : ''} 
          onClick={() => setMode('external')}
        >
          External URL
        </button>
      </div>

      <div className="cf-link-picker__input">
        {mode === 'internal' ? (
          <div className="internal-wrapper">
            <PageSearchPicker onSelect={(page) => onChange(`/page/${page.id}`)} />
            {value.startsWith('/page/') && (
              <div className="current-selection">Selected: <code>{value}</code></div>
            )}
          </div>
        ) : (
          <input 
            type="text" 
            placeholder="https://example.com"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="external-input"
          />
        )}
      </div>
    </div>
  );
};