import { Controller } from "app/code/thirdparty/decorators/controller";
import { Get } from "app/code/thirdparty/decorators/routes";
import { CanvasNode } from "../frontend/types";
import { AdminNavItem } from "app/code/thirdparty/decorators/admin-nav";
import { canvasAsPage } from "../utils";

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
}