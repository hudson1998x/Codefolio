import React, { useState } from "react";
import './style.scss';
import { registerComponent } from "@components/registry";

/**
 * Available themes for the GitHub profile trophy component.
 * @see https://github.com/ryo-ma/github-profile-trophy#apply-theme
 */
const TROPHY_THEMES = [
  'flat', 'onedark', 'gruvbox', 'dracula', 'monokai',
  'chalk', 'nord', 'alduin', 'darkhub', 'juicyfresh',
  'buddhism', 'oldie', 'radical', 'onestar', 'discord',
  'algolia', 'gitdimmed', 'tokyonight', 'matrix', 'apprentice',
  'dark_dimmed', 'nightmare', 'kimbie_dark',
] as const;

export type TrophyTheme = typeof TROPHY_THEMES[number];

/**
 * Trophy rank filters — only trophies at or above the selected rank are shown.
 * @see https://github.com/ryo-ma/github-profile-trophy#filter-by-rank
 */
const RANKS = ['SECRET', 'SSS', 'SS', 'S', 'AAA', 'AA', 'A', 'B', 'C'] as const;

export interface GitHubTrophyData {
  username: string;
  theme: TrophyTheme | string;
  rank: string;
  column: string;
  className: string;
}

/**
 * Renders a GitHub profile trophy showcase using the github-profile-trophy service.
 *
 * @remarks
 * Displays achievement trophies for commits, pull requests, issues, followers,
 * stars, repositories and more. No API key required.
 *
 * The `column` prop controls how many trophies appear per row (1–6).
 * The `rank` prop filters out trophies below the specified rank threshold.
 *
 * @example
 * ```tsx
 * <GitHubTrophy data={{ username: "torvalds", theme: "onedark", rank: "A", column: "6" }} />
 * ```
 */
export const GitHubTrophy: React.FC<{ data: GitHubTrophyData }> = ({ data }) => {
  const { username, theme = 'flat', rank = 'B', column = '6', className } = data;
  const [imgError, setImgError] = useState(false);

  if (!username) {
    return (
      <div className={`cf-gh-trophy cf-gh-trophy--error ${className ?? ''}`}>
        <i className="fab fa-github" />
        <span>Enter a GitHub username to display trophies</span>
      </div>
    );
  }

  const src = `https://github-profile-trophy.vercel.app/?username=${username}&theme=${theme}&rank=${rank}&column=${column}&margin-w=8&margin-h=8&no-bg=false&no-frame=false`;

  return (
    <div className={`cf-gh-trophy ${className ?? ''}`}>
      {imgError ? (
        <div className="cf-gh-trophy__error-card">
          <i className="fab fa-github" /> Failed to load trophies — check username
        </div>
      ) : (
        <img
          src={src}
          alt={`${username}'s GitHub trophies`}
          className="cf-gh-trophy__img"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
};

registerComponent({
  name: "GitHubTrophy",
  defaults: {
    username: '',
    theme: 'flat',
    rank: 'B',
    column: '6',
    className: '',
  },
  fields: {
    username:  { type: 'text',   label: 'GitHub Username' },
    theme:     { type: 'select', label: 'Theme', options: [...TROPHY_THEMES] },
    rank:      { type: 'select', label: 'Minimum Rank', options: [...RANKS] },
    column:    { type: 'select', label: 'Trophies Per Row', options: ['1','2','3','4','5','6'] },
    className: { type: 'text',   label: 'Class Name' },
  },
  component: GitHubTrophy as any,
  isCmsEditor: true,
  category: 'Integrations',
  icon: 'fab fa-github',
});