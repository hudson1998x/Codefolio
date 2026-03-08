import { Controller } from "@decorators/controller";
import { Get } from "@decorators/routes";
import { CanvasNode } from "../frontend/types";
import { canvasAsPage } from "../utils";

@Controller("content/en-admin/media")
export class MediaAdminController
{
    @Get("all/page.json")
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