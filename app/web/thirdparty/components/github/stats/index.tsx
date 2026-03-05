import React, { useState } from "react";
import './style.scss';
import { registerComponent } from "@components/registry";

/**
 * Available themes from the github-readme-stats service.
 *
 * @see https://github.com/anuradhave/github-readme-stats/blob/master/themes/README.md
 */
const THEMES = [
  'default', 'transparent', 'dark', 'radical', 'merko',
  'gruvbox', 'tokyonight', 'onedark', 'cobalt', 'synthwave',
  'highcontrast', 'dracula', 'catppuccin_mocha', 'nord',
  'nightowl', 'buefy', 'blue-green', 'algolia', 'great-gatsby',
  'darcula', 'bear', 'solarized-dark', 'solarized-light',
] as const;

export type GitHubTheme = typeof THEMES[number];

export interface GitHubStatsCardData {
  username: string;
  theme: GitHubTheme | string;
  showIcons: string;
  showRank: string;
  showStreak: string;
  showTopLangs: string;
  className: string;
}

/**
 * Renders a GitHub stats card embed using the github-readme-stats hosted service.
 *
 * @remarks
 * No API key required. All cards are rendered as `<img>` tags pointing to
 * `github-readme-stats.vercel.app` — the service handles GitHub API calls
 * server-side. Up to three cards can be shown depending on props:
 * - **Stats card** — always shown, displays commits, PRs, issues, stars
 * - **Streak card** — optional, shows current and longest contribution streak
 * - **Top languages card** — optional, shows most-used languages by repo
 *
 * @example
 * ```tsx
 * <GitHubStatsCard data={{ username: "torvalds", theme: "dark", ... }} />
 * ```
 */
export const GitHubStatsCard: React.FC<{ data: GitHubStatsCardData }> = ({ data }) => {
  const {
    username,
    theme = 'default',
    showIcons = 'true',
    showRank = 'true',
    showStreak = 'true',
    showTopLangs = 'true',
    className,
  } = data;

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  if (!username) {
    return (
      <div className={`cf-gh-stats cf-gh-stats--error ${className ?? ''}`}>
        <i className="fab fa-github" />
        <span>Enter a GitHub username to display stats</span>
      </div>
    );
  }

  const base = 'https://github-readme-stats.vercel.app/api';
  const common = `&theme=${theme}&border_radius=12&hide_border=false`;

  /**
   * Builds the stats card URL.
   * @see https://github.com/anuradhave/github-readme-stats#readme
   */
  const statsUrl = `${base}?username=${username}&show_icons=${showIcons}&rank_icon=${showRank === 'true' ? 'github' : 'none'}${common}`;

  /**
   * Builds the streak card URL via the community-maintained streak-stats service.
   * @see https://github.com/DenverCoder1/github-readme-streak-stats
   */
  const streakUrl = `https://github-readme-streak-stats.herokuapp.com?user=${username}&theme=${theme}&border_radius=12`;

  /**
   * Builds the top languages card URL.
   * @see https://github.com/anuradhave/github-readme-stats#top-languages-card
   */
  const langsUrl = `${base}/top-langs?username=${username}&layout=compact&langs_count=8${common}`;

  const handleImgError = (key: string) => {
    setImgErrors(prev => ({ ...prev, [key]: true }));
  };

  return (
    <div className={`cf-gh-stats ${className ?? ''}`}>
      {/* Stats Card — always shown */}
      <div className="cf-gh-stats__card">
        {imgErrors['stats'] ? (
          <div className="cf-gh-stats__error-card">
            <i className="fab fa-github" /> Failed to load stats — check username
          </div>
        ) : (
          <img
            src={statsUrl}
            alt={`${username}'s GitHub stats`}
            className="cf-gh-stats__img"
            onError={() => handleImgError('stats')}
          />
        )}
      </div>

      {/* Streak Card — optional */}
      {showStreak === 'true' && (
        <div className="cf-gh-stats__card">
          {imgErrors['streak'] ? (
            <div className="cf-gh-stats__error-card">
              <i className="fab fa-github" /> Failed to load streak
            </div>
          ) : (
            <img
              src={streakUrl}
              alt={`${username}'s GitHub streak`}
              className="cf-gh-stats__img"
              onError={() => handleImgError('streak')}
            />
          )}
        </div>
      )}

      {/* Top Languages Card — optional */}
      {showTopLangs === 'true' && (
        <div className="cf-gh-stats__card cf-gh-stats__card--langs">
          {imgErrors['langs'] ? (
            <div className="cf-gh-stats__error-card">
              <i className="fab fa-github" /> Failed to load languages
            </div>
          ) : (
            <img
              src={langsUrl}
              alt={`${username}'s top languages`}
              className="cf-gh-stats__img"
              onError={() => handleImgError('langs')}
            />
          )}
        </div>
      )}
    </div>
  );
};

registerComponent({
  name: "GitHubStatsCard",
  defaults: {
    username: '',
    theme: 'default',
    showIcons: 'true',
    showRank: 'true',
    showStreak: 'true',
    showTopLangs: 'true',
    className: '',
  },
  fields: {
    username:    { type: 'text',    label: 'GitHub Username' },
    theme:       { type: 'select',  label: 'Theme', options: [...THEMES] },
    showIcons:   { type: 'boolean', label: 'Show Icons' },
    showRank:    { type: 'boolean', label: 'Show Rank' },
    showStreak:  { type: 'boolean', label: 'Show Streak Card' },
    showTopLangs:{ type: 'boolean', label: 'Show Top Languages Card' },
    className:   { type: 'text',    label: 'Class Name' },
  },
  component: GitHubStatsCard as any,
  isCmsEditor: true,
  category: 'Integrations',
  icon: 'fab fa-github',
});