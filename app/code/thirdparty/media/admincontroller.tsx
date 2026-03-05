import { AdminNavItem } from "@decorators/admin-nav";
import { Controller } from "@decorators/controller";
import { Get } from "@decorators/routes";
import { CanvasNode } from "../frontend/types";
import { canvasAsPage } from "../utils";

@Controller("content/en-admin/media")
export class MediaAdminController
{
    @Get("all/page.json")
    @AdminNavItem("Media", undefined, 2000)
    public async listMedia() : Promise<CanvasNode>
    {
        return (
            canvasAsPage(
                <ui-MediaGalleryPage>

                </ui-MediaGalleryPage>
                , {
                    pageTitle: 'Media'
                }
            )
        )
    }
}