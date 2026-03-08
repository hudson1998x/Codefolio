import { Container } from "@decorators/di-container";
import { AdminController } from "../content/admincontroller";
import { Page } from "./entity";
import { PageService } from "./service";
import { Controller } from "@decorators/controller";
import { CanvasNode } from "../frontend/types";
/**
 * Admin controller for the {@link Page} entity, mounted at `content/en-admin/page`.
 *
 * Inherits list, edit, and add page rendering from {@link AdminController} and
 * wires up the {@link PageService} as the underlying data service via DI.
 */
@Controller('content/en-admin/page')
export class PageAdminController extends AdminController<Page>
{
    /**
     * The service instance used for all data operations on {@link Page} entities.
     * Resolved automatically from the DI container.
     */
    protected service: PageService = Container.resolve(PageService);

    /**
     * Returns the {@link Page} entity constructor, used by the base controller
     * to introspect field metadata via `@Entity` decorators.
     *
     * @returns The {@link Page} class reference.
     */
    public getTargetEntity(): Function {
        return Page;
    }
}