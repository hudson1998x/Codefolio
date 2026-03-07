import { Controller } from "app/code/thirdparty/decorators/controller";
import { Get } from "app/code/thirdparty/decorators/routes";
import { CanvasNode } from "../frontend/types";
import { AdminNavItem } from "app/code/thirdparty/decorators/admin-nav";
import { canvasAsPage } from "../utils";
import { exec } from "child_process";
import { Container } from "@decorators/di-container";
import { VcsService } from "../vcs/service";

@Controller("content/en-admin")
class AdminDashboardController
{
    private vcs:VcsService = Container.resolve(VcsService)

    @Get("page.json")
    @AdminNavItem("Dashboard", undefined, 1)
    public async homepage(): Promise<CanvasNode>
    {
        return canvasAsPage(
            <ui-AdminDashboard />
            ,
            {
                pageTitle: 'Dashboard'
            }
        )
    }

    /**
     * Returns the current and latest available Codefolio version.
     *
     * `current` is read from the local `package.json`. `latest` is fetched
     * from the remote release manifest; falls back to `"Unknown"` if the
     * request fails.
     */
    @Get("version.json")
    public async version(): Promise<{ current: string; latest: string }>
    {
        const currentPackageJson = require('package.json');
        const repoPackageJson: any = await fetch('https://hudson1998x.github.io/Codefolio/package.json')
            .then((r) => r.json())
            .catch(() => null);

        return {
            current: currentPackageJson.version ?? 'Unknown',
            latest:  repoPackageJson?.version   ?? 'Unknown',
        };
    }

    /**
     * Returns committed file counts broken down by content type.
     *
     * @returns A {@link VcsContentStats} object.
     */
    @Get("content-stats.json")
    public async contentStats()
    {
        return this.vcs.getContentStats();
    }

    /**
     * Returns the 20 most recent commits with their touched files,
     * for the activity feed widget.
     *
     * @returns An array of {@link VcsLogEntry} objects, newest first.
     */
    @Get("recent-activity.json")
    public async recentActivity()
    {
        return this.vcs.getRecentActivity(20);
    }

    /**
     * Returns a per-day commit count for the last 30 days,
     * for the sparkline widget. Every day in the window is present,
     * with `count: 0` for quiet days.
     *
     * @returns An array of {@link VcsCommitFrequency} objects sorted ascending.
     */
    @Get("commit-frequency.json")
    public async commitFrequency()
    {
        return this.vcs.getCommitFrequency(30);
    }

    /**
     * Returns high-level site stats derived from git history:
     * creation date, total commit count, and current branch.
     *
     * @returns A {@link VcsSiteStats} object.
     */
    @Get("site-stats.json")
    public async siteStats()
    {
        return this.vcs.getSiteStats();
    }

    /**
     * Runs the Codefolio self-update script (`npm run codefolio:update`).
     *
     * @returns `{ success: true }` on completion, or `{ success: false, message }` on failure.
     */
    @Get("update")
    public async runUpdate(): Promise<{ success: boolean; message: string }>
    {
        return new Promise((resolve) => {
            exec("npm run codefolio:update", { cwd: process.cwd() }, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        success: false,
                        message: stderr?.trim() || error.message
                    });
                } else {
                    resolve({
                        success: true,
                        message: stdout?.trim() || "Update completed successfully."
                    });
                }
            });
        });
    }
}