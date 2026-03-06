import { Controller } from "@decorators/controller";
import { ContentController } from "../content/controller";
import { Documents } from "./entity";
import { DocumentsService } from "./service";
import { Container } from "@decorators/di-container";

/**
 * REST API controller for the {@link Documents} entity, mounted at `/api/documents`.
 *
 * Inherits standard CRUD route handling from {@link ContentController} and
 * wires up the {@link DocumentsService} as the underlying data service via DI.
 */
@Controller("/api/documents")
export class DocumentsController extends ContentController<Documents>
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
