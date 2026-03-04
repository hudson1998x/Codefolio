import { useEffect, useState, useCallback } from "react";
import { VcsStatus, VcsCommit } from "app/code/thirdparty/vcs/service";
import './style.scss';

/**
 * Combined VCS state containing the current repository status
 * and the most recent commit metadata.
 */
interface VcsData {
  /** Current working tree status, including branch, sync state, and file changes. */
  status: VcsStatus;
  /** The most recent commit on the current branch, if available. */
  lastCommit?: VcsCommit;
}

/**
 * Maps VCS file-change statuses to their single-character display glyphs.
 * Falls back to `"•"` for any unrecognised status via the `other` key.
 */
const statusIcons: Record<string, string> = {
  modified: "M", added: "A", deleted: "D", renamed: "R", untracked: "?", other: "•",
};

/**
 * `VcsStatusBar` renders a compact, real-time version-control status strip
 * intended for embedding in an editor or admin toolbar.
 *
 * It displays three logical sections:
 * - **Branch & Sync** — current branch name plus ahead/behind commit counts.
 * - **Changes** — a delta badge (Δ n) with a tooltip listing every dirty file.
 * - **Commit** — the short hash and subject line of the most recent commit.
 *
 * Data is fetched from `/content/en-admin/vcs/status.json` on mount and can be
 * manually refreshed via the `↺` button. While loading, a CSS spinner is shown;
 * on error, the HTTP status code is displayed alongside the refresh button.
 *
 * @example
 * ```tsx
 * // Drop into any toolbar — no props required.
 * <VcsStatusBar />
 * ```
 */
export const VcsStatusBar: React.FC = () => {
  const [data, setData] = useState<VcsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches fresh VCS data from the status endpoint.
   *
   * Wrapped in `useCallback` so the stable reference can be passed to the
   * refresh button without re-registering the `useEffect` on every render.
   *
   * @returns A promise that resolves once state has been updated, or rejects
   *   silently after writing an error message to the `error` state slice.
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/content/en-admin/vcs/status.json");
      if (!res.ok) throw new Error(`${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Err");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Trigger the initial data fetch once on mount. */
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div className="cf-vcs"><span className="cf-vcs__spinner" /></div>;
  }

  if (error || !data) {
    return (
      <div className={`cf-vcs ${error ? 'cf-vcs--error' : ''}`}>
        <span>{error || "No Data"}</span>
        <button className="cf-vcs__refresh" onClick={fetchData}>↺</button>
      </div>
    );
  }

  const { status, lastCommit } = data;

  /** `true` when the working tree contains at least one uncommitted change. */
  const hasChanges = status.changeCount > 0;

  /**
   * Human-readable local timestamp of the last commit, used in the commit
   * section tooltip. Empty string when no commit data is present.
   */
  const timestamp = lastCommit ? new Date(lastCommit.timestamp).toLocaleString() : "";

  return (
    <div className={`cf-vcs ${hasChanges ? "cf-vcs--dirty" : "cf-vcs--clean"}`}>

      {/* Section 1: Branch & Sync */}
      <div className="cf-vcs__section">
        <span className="cf-vcs__branch">
          <span className="cf-vcs__branch-icon">⎇</span> {status.branch}
        </span>
        {(status.ahead > 0 || status.behind > 0) && (
          <span className="cf-vcs__sync">
            {status.ahead > 0 && `↑${status.ahead}`}
            {status.behind > 0 && `↓${status.behind}`}
          </span>
        )}
      </div>

      {/* Section 2: Changes (Condensed) */}
      {hasChanges && (
        <div className="cf-vcs__section">
          {/*
           * The title attribute renders a newline-delimited file list, e.g.:
           *   M src/foo.ts
           *   A src/bar.ts
           * Unknown statuses fall back to the "other" glyph ("•").
           */}
          <span
            className="cf-vcs__changes"
            title={status.changes.map(c => `${statusIcons[c.status] || '•'} ${c.path}`).join("\n")}
          >
            Δ {status.changeCount}
          </span>
        </div>
      )}

      {/* Section 3: Commit Info */}
      {lastCommit && (
        <div className="cf-vcs__section cf-vcs__commit" title={`${lastCommit.message}\n\n${timestamp}`}>
          <span className="cf-vcs__commit-hash">{lastCommit.shortHash}</span>
          <span className="cf-vcs__commit-message">{lastCommit.message}</span>
        </div>
      )}

      <button className="cf-vcs__refresh" onClick={fetchData} title="Refresh Status">↺</button>
    </div>
  );
};