import { Container } from "@decorators/di-container";
import { AdminController } from "../content/admincontroller";
import { Documents } from "./entity";
import { DocumentsService } from "./service";
import { Controller } from "@decorators/controller";

/**
 * Admin controller for the {@link Documents} entity, mounted at `content/en-admin/documents`.
 *
 * Inherits list, edit, and add page rendering from {@link AdminController} and
 * wires up the {@link DocumentsService} as the underlying data service via DI.
 */
@Controller('content/en-admin/documents')
export class DocumentsAdminController extends AdminController<Documents>
{
    /**
     * The service instance used for all data operations on {@link Documents} entities.
     * Resolved automatically from the DI container.
     */
    protected service: DocumentsService = Container.resolve(DocumentsService);

    /**
     * Returns the {@link Documents} entity constructor, used by the base controller
     * to introspect field metadata via `@Entity` decorators.
     *
     * @returns The {@link Documents} class reference.
     */
    public getTargetEntity(): Function {
        return Documents;
    }
}
