import { Service } from "@decorators/service";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Represents a single changed file in the working tree.
 */
export interface VcsFileStatus {
  /** The git status code mapped to a human-readable status. */
  status: "modified" | "added" | "deleted" | "untracked" | "renamed" | "other";
  /** The file path relative to the repo root. */
  path: string;
}

/**
 * A summary of the current repository status.
 */
export interface VcsStatus {
  /** The current branch name, or `"unborn"` if the repo has no commits yet. */
  branch: string;
  /** Number of commits ahead of the remote tracking branch. `0` if no upstream. */
  ahead: number;
  /** Number of commits behind the remote tracking branch. `0` if no upstream. */
  behind: number;
  /** All changed files in the working tree and index. */
  changes: VcsFileStatus[];
  /** Total number of changed files. */
  changeCount: number;
}

/**
 * The most recent commit on the current branch.
 */
export interface VcsCommit {
  /** The full 40-character commit hash. */
  hash: string;
  /** The abbreviated 7-character commit hash. */
  shortHash: string;
  /** The commit message subject line. */
  message: string;
  /** The commit author name. */
  author: string;
  /** The commit timestamp as an ISO 8601 string. */
  timestamp: string;
}

/**
 * A parsed commit from the git log, used for activity feeds.
 */
export interface VcsLogEntry extends VcsCommit {
  /** Human-readable relative time e.g. "2 hours ago" */
  timeAgo: string;
  /** Files touched in this commit */
  files: string[];
}

/**
 * Content counts derived by walking committed files in known directories.
 */
export interface VcsContentStats {
  /** Number of committed files under `content/pages`. */
  pages: number;
  /** Number of committed files under `content/blogs`. */
  blogs: number;
  /** Number of committed files under `content/prefabs`. */
  prefabs: number;
  /** Number of committed files under `content/documents`. */
  documents: number;
  /** Number of committed media files (images, video) under `content/media`. */
  media: number;
}

/**
 * A single day's commit count for the activity sparkline.
 */
export interface VcsCommitFrequency {
  /** The date in `YYYY-MM-DD` format. */
  date: string;
  /** Number of commits made on this date. `0` for days with no activity. */
  count: number;
}

/**
 * High-level facts about the repository derived from git history.
 */
export interface VcsSiteStats {
  /** ISO timestamp of the very first commit — i.e. when the site was created. */
  createdAt: string | null;
  /** Total number of commits ever made to this repo. */
  totalCommits: number;
  /** Current branch name. */
  branch: string;
}

/**
 * Service responsible for reading and mutating the state of the local git repository.
 *
 * @remarks
 * All methods shell out to the `git` CLI via `child_process.exec`. Every
 * method is defensively wrapped — an uninitialised repo, a repo with no
 * commits, a missing upstream, or a missing git binary will never throw
 * an unhandled error. Instead, methods return safe fallback values so the
 * admin UI always renders regardless of repo state.
 *
 * This service is local/authoring-only and is never included in the
 * static export.
 */
@Service()
export class VcsService {

  // ─── Existing methods ────────────────────────────────────────────────────────

  /**
   * Returns the name of the currently checked-out branch.
   *
   * Falls back to `git symbolic-ref` for repos with no commits yet
   * (where `HEAD` has no resolved hash), and ultimately returns
   * `"unborn"` if neither command succeeds.
   *
   * @returns The branch name (e.g. `"main"`, `"feature/my-feature"`),
   *          or `"unborn"` if the repo has no commits or git is unavailable.
   */
  public async getBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync("git rev-parse --abbrev-ref HEAD");
      const branch = stdout.trim();
      if (branch) return branch;
    } catch {}

    try {
      const { stdout } = await execAsync("git symbolic-ref --short HEAD");
      const branch = stdout.trim();
      if (branch) return branch;
    } catch {}

    return "unborn";
  }

  /**
   * Returns a full status summary of the current repository including
   * branch name, ahead/behind counts, and all changed files.
   *
   * Never throws — all constituent calls are individually guarded and
   * return safe fallback values on failure.
   *
   * @returns A {@link VcsStatus} object. On a completely uninitialised
   *          repo, returns `{ branch: "unborn", ahead: 0, behind: 0, changes: [], changeCount: 0 }`.
   */
  public async getStatus(): Promise<VcsStatus> {
    const [branch, aheadBehind, changes] = await Promise.all([
      this.getBranch(),
      this.getAheadBehind(),
      this.getChanges(),
    ]);

    return {
      branch,
      ...aheadBehind,
      changes,
      changeCount: changes.length,
    };
  }

  /**
   * Returns the most recent commit on the current branch, or `null` if
   * the repo has no commits yet or the log cannot be read.
   *
   * Uses a `\x1f` (unit separator) delimiter between fields to safely
   * handle commit messages containing any printable character.
   *
   * @returns A {@link VcsCommit} object, or `null` if unavailable.
   */
  public async getLastCommit(): Promise<VcsCommit | null> {
    try {
      const format = ["%H", "%h", "%s", "%an", "%cI"].join("%x1f");
      const { stdout } = await execAsync(`git log -1 --format="${format}"`);

      const trimmed = stdout.trim();
      if (!trimmed) return null;

      const parts = trimmed.split("\x1f");
      if (parts.length < 5) return null;

      const [hash, shortHash, message, author, timestamp] = parts;
      if (!hash || !shortHash) return null;

      return { hash, shortHash, message: message ?? "", author: author ?? "", timestamp: timestamp ?? "" };
    } catch {
      return null;
    }
  }

  /**
   * Stages a single file in the git index via `git add`.
   *
   * @param file - The path to the file to stage, relative to the repo root.
   * @throws {Error} If the `git add` command fails, with `stderr` as the message.
   */
  public async addFile(file: string): Promise<void> {
    try {
      await execAsync(`git add "${file}"`);
    } catch (error) {
      console.error("Git Deploy Error:", error);
      throw new Error((error as any).stderr || "Failed to deploy to Git");
    }
  }

  /**
   * Stages all changes, commits them with the given message, and pushes
   * to the remote tracking branch.
   *
   * Equivalent to running `git add . && git commit -m "<message>" && git push origin <branch>`.
   *
   * @param message - The commit message. Double quotes are escaped automatically.
   * @throws {Error} If any step (add, commit, or push) fails, with `stderr` as the message.
   */
  public async deploy(message: string): Promise<void> {
    try {
      await execAsync("git add .");
      const escapedMessage = message.replace(/"/g, '\\"');
      await execAsync(`git commit -m "${escapedMessage}"`);
      const branch = await this.getBranch();
      await execAsync(`git push origin ${branch}`);
    } catch (error) {
      console.error("Git Deploy Error:", error);
      throw new Error((error as any).stderr || "Failed to deploy to Git");
    }
  }

  // ─── New dashboard methods ────────────────────────────────────────────────────

  /**
   * Returns recent commits with the files they touched, for the activity feed.
   * 
   * @param limit How many commits to return. Defaults to 20.
   * @returns An array of {@link VcsLogEntry} objects, newest first.
   */
  public async getRecentActivity(limit = 20): Promise<VcsLogEntry[]> {
    try {
      const format = ["%H", "%h", "%s", "%an", "%cI", "%cr"].join("%x1f");
      const { stdout } = await execAsync(
        `git log -${limit} --format="${format}"`
      );

      const lines = stdout.trim().split("\n").filter(Boolean);
      const entries: VcsLogEntry[] = [];

      for (const line of lines) {
        const parts = line.split("\x1f");
        if (parts.length < 6) continue;

        const [hash, shortHash, message, author, timestamp, timeAgo] = parts;

        // Get files changed in this commit
        let files: string[] = [];
        try {
          const { stdout: fileOut } = await execAsync(
            `git diff-tree --no-commit-id -r --name-only ${hash}`
          );
          files = fileOut.trim().split("\n").filter(Boolean);
        } catch {}

        entries.push({ hash, shortHash, message, author, timestamp, timeAgo, files });
      }

      return entries;
    } catch {
      return [];
    }
  }

  /**
   * Counts committed files per content type by inspecting `git ls-files`
   * for each known content directory.
   *
   * Adjust the directory paths to match your project structure.
   *
   * @returns A {@link VcsContentStats} object.
   */
  public async getContentStats(): Promise<VcsContentStats> {
    const IGNORED_FILENAMES = [
        ".auto_increment",
        "index.ndjson",
    ];

    const count = async (dir: string, extensions?: string[]): Promise<number> => {
        try {
            const { stdout } = await execAsync(`git ls-files ${dir}`);
            const files = stdout
                .trim()
                .split("\n")
                .filter(Boolean)
                .filter((f) => !IGNORED_FILENAMES.some((name) => f.endsWith(name)));
            if (!extensions) return files.length;
            return files.filter(f => extensions.some(ext => f.endsWith(ext))).length;
        } catch {
            return 0;
        }
    };

    const [pages, blogs, prefabs, documents, media] = await Promise.all([
        count("content/page"),
        count("content/blog"),
        count("content/prefab"),
        count("content/documents"),
        count("media", [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".mp4", ".mov"]),
    ]);

    return { pages, blogs, prefabs, documents, media };
}

  /**
   * Returns a per-day commit count for the last N days, suitable for
   * rendering a sparkline or heatmap.
   *
   * @param days How many days back to look. Defaults to 30.
   * @returns An array of {@link VcsCommitFrequency} sorted ascending by date,
   *          with a zero-count entry for every day that had no commits.
   */
  public async getCommitFrequency(days = 30): Promise<VcsCommitFrequency[]> {
    try {
      const { stdout } = await execAsync(
        `git log --since="${days} days ago" --pretty=format:"%ad" --date=short`
      );

      const rawDates = stdout.trim().split("\n").filter(Boolean);

      // Build a map of date → count
      const countMap: Record<string, number> = {};
      for (const date of rawDates) {
        countMap[date] = (countMap[date] ?? 0) + 1;
      }

      // Fill in every day in the range, including zeros
      const result: VcsCommitFrequency[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const date = d.toISOString().slice(0, 10);
        result.push({ date, count: countMap[date] ?? 0 });
      }

      return result;
    } catch {
      return [];
    }
  }

  /**
   * Returns high-level site stats derived from git history:
   * when the site was created, total commit count, and current branch.
   *
   * @returns A {@link VcsSiteStats} object.
   */
  public async getSiteStats(): Promise<VcsSiteStats> {
    const [branch, createdAt, totalCommits] = await Promise.all([
      this.getBranch(),
      this.getFirstCommitDate(),
      this.getTotalCommitCount(),
    ]);

    return { createdAt, totalCommits, branch };
  }

  /**
   * Returns the ISO timestamp of the very first commit in the repo.
   * @internal
   */
  private async getFirstCommitDate(): Promise<string | null> {
    try {
      const { stdout } = await execAsync(
        `git log --reverse --pretty=format:"%cI" | head -1`
      );
      return stdout.trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * Returns the total number of commits on the current branch.
   * @internal
   */
  private async getTotalCommitCount(): Promise<number> {
    try {
      const { stdout } = await execAsync("git rev-list --count HEAD");
      const count = parseInt(stdout.trim(), 10);
      return isNaN(count) ? 0 : count;
    } catch {
      return 0;
    }
  }

  /**
   * Returns the list of all changed files in the working tree and index,
   * parsed from `git status --porcelain`.
   *
   * Returns an empty array if there are no changes, the repo has no
   * commits yet, or the command fails for any reason.
   *
   * @returns An array of {@link VcsFileStatus} objects.
   * @internal
   */
  private async getChanges(): Promise<VcsFileStatus[]> {
    try {
      const { stdout } = await execAsync("git status --porcelain");
      if (!stdout.trim()) return [];

      return stdout.trim().split("\n").filter(Boolean).map((line): VcsFileStatus => {
        const code = line.slice(0, 2).trim();
        const path = line.slice(3).trim();

        let status: VcsFileStatus["status"];
        if      (code === "M" || code === "MM") status = "modified";
        else if (code === "A")                  status = "added";
        else if (code === "D")                  status = "deleted";
        else if (code === "R")                  status = "renamed";
        else if (code === "??")                 status = "untracked";
        else                                    status = "other";

        return { status, path };
      });
    } catch {
      return [];
    }
  }

  /**
   * Returns the number of commits the current branch is ahead of and
   * behind its remote tracking branch.
   *
   * Returns `{ ahead: 0, behind: 0 }` in all failure cases:
   * - No upstream configured (new local branch)
   * - Repo has no commits yet
   * - Git unavailable
   *
   * @returns An object with `ahead` and `behind` commit counts.
   * @internal
   */
  private async getAheadBehind(): Promise<{ ahead: number; behind: number }> {
    try {
      const { stdout } = await execAsync(
        "git rev-list --left-right --count HEAD...@{upstream}"
      );
      const parts = stdout.trim().split("\t");
      if (parts.length < 2) return { ahead: 0, behind: 0 };

      const ahead  = parseInt(parts[0], 10);
      const behind = parseInt(parts[1], 10);

      return {
        ahead:  isNaN(ahead)  ? 0 : ahead,
        behind: isNaN(behind) ? 0 : behind,
      };
    } catch {
      return { ahead: 0, behind: 0 };
    }
  }
}