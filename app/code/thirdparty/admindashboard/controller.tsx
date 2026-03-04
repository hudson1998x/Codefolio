import { Controller } from "app/code/thirdparty/decorators/controller";
import { Get } from "app/code/thirdparty/decorators/routes";
import { CanvasNode } from "../frontend/types";
import { AdminNavItem } from "app/code/thirdparty/decorators/admin-nav";

@Controller("content/en-admin")
class AdminDashboardController
{
    @Get("page.json")
    @AdminNavItem("Dashboard", undefined, 1)
    public async homepage(): Promise<CanvasNode>
    {
        return (
            <ui-Section>
                Welcome to your admin
            </ui-Section>
        )
    }
}