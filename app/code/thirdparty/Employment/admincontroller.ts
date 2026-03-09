import { Container } from "@decorators/di-container";
import { AdminController } from "../content/admincontroller";
import { Employment } from "./entity";
import { EmploymentService } from "./service";
import { Controller } from "@decorators/controller";

/**
 * Admin controller for the {@link Employment} entity, mounted at `content/en-admin/employment`.
 *
 * Inherits list, edit, and add page rendering from {@link AdminController} and
 * wires up the {@link EmploymentService} as the underlying data service via DI.
 */
@Controller('content/en-admin/employment')
export class EmploymentAdminController extends AdminController<Employment>
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
