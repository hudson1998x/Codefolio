import { Container } from "@decorators/di-container";
import { AdminController } from "../content/admincontroller";
import { Education } from "./entity";
import { EducationService } from "./service";
import { Controller } from "@decorators/controller";

/**
 * Admin controller for the {@link Education} entity, mounted at `content/en-admin/education`.
 *
 * Inherits list, edit, and add page rendering from {@link AdminController} and
 * wires up the {@link EducationService} as the underlying data service via DI.
 */
@Controller('content/en-admin/education')
export class EducationAdminController extends AdminController<Education>
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
