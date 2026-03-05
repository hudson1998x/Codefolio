import { useEffect, useState } from "react";
import { registerComponent, CodefolioProps } from "@components/registry";
import './style.scss';
import { ThemeData } from "./types"; // import your ThemeData type

export interface ThemeSelectorProps {
  theme: string; // currently selected theme key/folder
}

export const ThemeSelector = ({ data }: CodefolioProps<ThemeSelectorProps>) => {
  const [themes, setThemes] = useState<ThemeData[]>([]);
  const [selected, setSelected] = useState<string>(data.theme || "default");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const res = await fetch("/content/en-admin/configuration/themes");
        if (!res.ok) throw new Error("Failed to fetch themes");
        const json: ThemeData[] = await res.json();
        setThemes(json);
      } catch (err) {
        console.error("Error loading themes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchThemes();
  }, []);

  const handleSelect = (themeName: string) => {
    setSelected(themeName);
    // Optionally, persist selection here or let the parent form handle it
    const inputEl = document.querySelector<HTMLInputElement>(
      'input[name="theme[theme]"]'
    );
    if (inputEl) inputEl.value = themeName;
  };

  if (loading) return <p>Loading themes...</p>;
  if (!themes.length) return <p>No themes found.</p>;

  return (
    <div className="cf-theme-selector">
      {/* Hidden input so form submission picks up selected theme */}
      <input type="hidden" name="theme[theme]" value={selected} />
      <input type="hidden" name="theme[component]" value="Admin/Config/ThemeSelector"/>

      <div className="cf-theme-selector__grid">
        {themes.map((theme) => (
          <div
            key={theme.name}
            className={`cf-theme-selector__item ${
              selected === theme.key ? "selected" : ""
            }`}
            onClick={() => handleSelect(theme.name)}
          >
            {theme.previewImage && (
              <img
                className="cf-theme-selector__preview"
                src={`/app/web/themes/${theme.key}/${theme.previewImage}`}
                alt={`${theme.name} preview`}
              />
            )}
            <div className="cf-theme-selector__info">
              <strong>{theme.name}</strong>
              <small>{theme.vendor}</small>
              <span className="cf-theme-selector__version">
                {theme.version.major}.{theme.version.minor}.{theme.version.patch}
              </span>
            </div>
            {selected === theme.name && (
              <span className="cf-theme-selector__selected-badge">✔</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

registerComponent({
  name: "Admin/Config/ThemeSelector",
  defaults: {
    component: "Admin/Config/ThemeSelector",
    theme: "default"
  },
  component: ThemeSelector,
});