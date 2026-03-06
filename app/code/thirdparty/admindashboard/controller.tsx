import { Controller } from "app/code/thirdparty/decorators/controller";
import { Get } from "app/code/thirdparty/decorators/routes";
import { CanvasNode } from "../frontend/types";
import { AdminNavItem } from "app/code/thirdparty/decorators/admin-nav";
import { canvasAsPage } from "../utils";
import { exec } from "child_process";

@Controller("content/en-admin")
class AdminDashboardController
{
    @Get("page.json")
    @AdminNavItem("Dashboard", undefined, 1)
    public async homepage(): Promise<CanvasNode>
    {

        const currentPackageJson = require('package.json');
        const repoPackageJson: any = await fetch('https://hudson1998x.github.io/Codefolio/package.json').then((resp) => resp.json());

        return canvasAsPage(
            <ui-Section className='dashboard'>
                <ui-AdminUpdates currentVersion={currentPackageJson.version ?? 'Unknown'} latest={repoPackageJson?.version ?? 'Unknown'}/>
            </ui-Section>,
            {
                pageTitle: 'Dashboard'
            }
        )
    }

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