import { Controller } from "@decorators/controller";
import { ContentController } from "../content/controller";
import { Employment } from "./entity";
import { EmploymentService } from "./service";
import { Container } from "@decorators/di-container";

/**
 * REST API controller for the {@link Employment} entity, mounted at `/api/employment`.
 *
 * Inherits standard CRUD route handling from {@link ContentController} and
 * wires up the {@link EmploymentService} as the underlying data service via DI.
 */
@Controller("/api/employment")
export class EmploymentController extends ContentController<Employment>
{
    /**
     * The service instance used for all data operations on {@link Employment} entities.
     * Resolved automatically from the DI container.
     */
    protected service: EmploymentService = Container.resolve(EmploymentService);

    /**
     * Returns the {@link Employment} entity constructor, used by the base controller
     * to introspect field metadata via `@Entity` decorators.
     *
     * @returns The {@link Employment} class reference.
     */
    public getTargetEntity(): Function {
        return Employment;
    }
}
