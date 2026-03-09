import { Controller } from "@decorators/controller";
import { ContentController } from "../content/controller";
import { Education } from "./entity";
import { EducationService } from "./service";
import { Container } from "@decorators/di-container";

/**
 * REST API controller for the {@link Education} entity, mounted at `/api/education`.
 *
 * Inherits standard CRUD route handling from {@link ContentController} and
 * wires up the {@link EducationService} as the underlying data service via DI.
 */
@Controller("/api/education")
export class EducationController extends ContentController<Education>
{
    /**
     * The service instance used for all data operations on {@link Education} entities.
     * Resolved automatically from the DI container.
     */
    protected service: EducationService = Container.resolve(EducationService);

    /**
     * Returns the {@link Education} entity constructor, used by the base controller
     * to introspect field metadata via `@Entity` decorators.
     *
     * @returns The {@link Education} class reference.
     */
    public getTargetEntity(): Function {
        return Education;
    }
}
