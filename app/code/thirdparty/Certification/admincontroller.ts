import { Container } from "@decorators/di-container";
import { AdminController } from "../content/admincontroller";
import { Certification } from "./entity";
import { CertificationService } from "./service";
import { Controller } from "@decorators/controller";

/**
 * Admin controller for the {@link Certification} entity, mounted at `content/en-admin/certification`.
 *
 * Inherits list, edit, and add page rendering from {@link AdminController} and
 * wires up the {@link CertificationService} as the underlying data service via DI.
 */
@Controller('content/en-admin/certification')
export class CertificationAdminController extends AdminController<Certification>
{
    /**
     * The service instance used for all data operations on {@link Certification} entities.
     * Resolved automatically from the DI container.
     */
    protected service: CertificationService = Container.resolve(CertificationService);

    /**
     * Returns the {@link Certification} entity constructor, used by the base controller
     * to introspect field metadata via `@Entity` decorators.
     *
     * @returns The {@link Certification} class reference.
     */
    public getTargetEntity(): Function {
        return Certification;
    }
}
