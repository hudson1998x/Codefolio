import React, { useState } from "react";
import './style.scss';
import { registerComponent } from "@components/registry";

/**
 * Available themes for the GitHub activity graph.
 * @see https://github.com/Ashutosh00710/github-readme-activity-graph#available-themes
 */
const GRAPH_THEMES = [
  'default', 'transparent', 'react', 'react-dark', 'github',
  'github-compact', 'xcode', 'rogue', 'merko', 'vue',
  'tokyo-night', 'high-contrast', 'dracula', 'nord',
  'catppuccin-mocha', 'one-dark',
] as const;

export type GraphTheme = typeof GRAPH_THEMES[number];

export interface GitHubActivityGraphData {
  username: string;
  theme: GraphTheme | string;
  area: string;
  hideBorder: string;
  className: string;
}

/**
 * Renders a GitHub contribution activity graph using the
 * github-readme-activity-graph hosted service.
 *
 * @remarks
 * Displays the user's contribution history as a line/area graph spanning
 * the past year. No API key required. The `area` prop fills the area under
 * the line for a more visual look.
 *
 * @example
 * ```tsx
 * <GitHubActivityGraph data={{ username: "torvalds", theme: "react-dark", area: "true" }} />
 * ```
 */
export const GitHubActivityGraph: React.FC<{ data: GitHubActivityGraphData }> = ({ data }) => {
  const { username, theme = 'default', area = 'true', hideBorder = 'false', className } = data;
  const [imgError, setImgError] = useState(false);

  if (!username) {
    return (
      <div className={`cf-gh-graph cf-gh-graph--error ${className ?? ''}`}>
        <i className="fab fa-github" />
        <span>Enter a GitHub username to display activity graph</span>
      </div>
    );
  }

  const src = `https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=${theme}&area=${area}&hide_border=${hideBorder}&radius=12`;

  return (
    <div className={`cf-gh-graph ${className ?? ''}`}>
      {imgError ? (
        <div className="cf-gh-graph__error-card">
          <i className="fab fa-github" /> Failed to load activity graph — check username
        </div>
      ) : (
        <img
          src={src}
          alt={`${username}'s GitHub activity graph`}
          className="cf-gh-graph__img"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
};

registerComponent({
  name: "GitHubActivityGraph",
  defaults: {
    username: '',
    theme: 'default',
    area: 'true',
    hideBorder: 'false',
    className: '',
  },
  fields: {
    username:   { type: 'text',    label: 'GitHub Username' },
    theme:      { type: 'select',  label: 'Theme', options: [...GRAPH_THEMES] },
    area:       { type: 'boolean', label: 'Fill Area Under Graph' },
    hideBorder: { type: 'boolean', label: 'Hide Border' },
    className:  { type: 'text',    label: 'Class Name' },
  },
  component: GitHubActivityGraph as any,
  isCmsEditor: true,
  category: 'Integrations',
  icon: 'fab fa-github',
});