import React, { useState } from "react";
import './style.scss';
import { registerComponent } from "@components/registry";

/**
 * Available themes from the github-readme-stats service.
 * Shared across all GitHub embed components for consistency.
 */
const THEMES = [
  'default', 'transparent', 'dark', 'radical', 'merko',
  'gruvbox', 'tokyonight', 'onedark', 'cobalt', 'synthwave',
  'highcontrast', 'dracula', 'catppuccin_mocha', 'nord',
  'nightowl', 'buefy', 'blue-green', 'algolia', 'great-gatsby',
  'darcula', 'bear', 'solarized-dark', 'solarized-light',
] as const;

export type GitHubTheme = typeof THEMES[number];

export interface GitHubRepoCardData {
  username: string;
  repo: string;
  theme: GitHubTheme | string;
  className: string;
}

/**
 * Renders a GitHub repository pin card using the github-readme-stats service.
 *
 * @remarks
 * Displays the repo name, description, primary language, star count and
 * fork count. No API key required — the service handles GitHub API calls
 * server-side. The card links to the repository on GitHub.
 *
 * @example
 * ```tsx
 * <GitHubRepoCard data={{ username: "vercel", repo: "next.js", theme: "dark" }} />
 * ```
 */
export const GitHubRepoCard: React.FC<{ data: GitHubRepoCardData }> = ({ data }) => {
  const { username, repo, theme = 'default', className } = data;
  const [imgError, setImgError] = useState(false);

  if (!username || !repo) {
    return (
      <div className={`cf-gh-repo cf-gh-repo--error ${className ?? ''}`}>
        <i className="fab fa-github" />
        <span>Enter a GitHub username and repo name</span>
      </div>
    );
  }

  const src = `https://github-readme-stats.vercel.app/api/pin?username=${username}&repo=${repo}&theme=${theme}&border_radius=12`;

  return (
    <div className={`cf-gh-repo ${className ?? ''}`}>
      {imgError ? (
        <div className="cf-gh-repo__error-card">
          <i className="fab fa-github" /> Failed to load repo — check username and repo name
        </div>
      ) : (
        <a
          href={`https://github.com/${username}/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="cf-gh-repo__link"
        >
          <img
            src={src}
            alt={`${username}/${repo} on GitHub`}
            className="cf-gh-repo__img"
            onError={() => setImgError(true)}
          />
        </a>
      )}
    </div>
  );
};

registerComponent({
  name: "GitHubRepoCard",
  defaults: {
    username: '',
    repo: '',
    theme: 'default',
    className: '',
  },
  fields: {
    username:  { type: 'text',   label: 'GitHub Username' },
    repo:      { type: 'text',   label: 'Repository Name' },
    theme:     { type: 'select', label: 'Theme', options: [...THEMES] },
    className: { type: 'text',   label: 'Class Name' },
  },
  component: GitHubRepoCard as any,
  isCmsEditor: true,
  category: 'Integrations',
  icon: 'fab fa-github',
});