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
 * Service responsible for reading the current state of the local git
 * repository.
 *
 * @remarks
 * All methods shell out to the `git` CLI via `child_process.exec`. Every
 * method is defensively wrapped — an uninitialised repo, a repo with no
 * commits, a missing upstream, or a missing git binary will never throw
 * an unhandled error. Instead methods return safe fallback values so the
 * admin UI always renders regardless of the repo state.
 *
 * This service is local/authoring-only and is never included in the
 * static export.
 */
@Service()
export class VcsService {

  /**
   * Returns the name of the currently checked-out branch.
   *
   * Falls back to `git symbolic-ref` for repos with no commits yet
   * (where `HEAD` has no resolved hash), and ultimately returns
   * `"unborn"` if neither command succeeds.
   *
   * @returns The branch name (e.g. `"main"`, `"feature/my-feature"`),
   *          or `"unborn"` if the repo has no commits.
   */
  public async getBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync("git rev-parse --abbrev-ref HEAD");
      const branch = stdout.trim();
      if (branch) return branch;
    } catch {
      // HEAD not resolved — repo likely has no commits yet.
    }

    try {
      // Works on a fresh repo before the first commit.
      const { stdout } = await execAsync("git symbolic-ref --short HEAD");
      const branch = stdout.trim();
      if (branch) return branch;
    } catch {
      // Not a git repo or git is unavailable.
    }

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

      // Guard against partially populated log output.
      if (!hash || !shortHash) return null;

      return { hash, shortHash, message: message ?? "", author: author ?? "", timestamp: timestamp ?? "" };
    } catch {
      return null;
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

      return stdout
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line): VcsFileStatus => {
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

  public async addFile(file: string): Promise<void> {
    try {
      // 1. Stage all changes
      await execAsync("git add \"" + file + "\"");

    } catch (error) {
      console.error("Git Deploy Error:", error);
      throw new Error((error as any).stderr || "Failed to deploy to Git");
    }
  }

  public async deploy(message: string): Promise<void> {
    try {
      // 1. Stage all changes
      await execAsync("git add .");
      
      // 2. Commit with the provided message
      // Using double quotes and escaping to handle special characters in the message
      const escapedMessage = message.replace(/"/g, '\\"');
      await execAsync(`git commit -m "${escapedMessage}"`);
      
      // 3. Push to current branch
      const branch = await this.getBranch();
      await execAsync(`git push origin ${branch}`);
    } catch (error) {
      console.error("Git Deploy Error:", error);
      throw new Error((error as any).stderr || "Failed to deploy to Git");
    }
  }
}