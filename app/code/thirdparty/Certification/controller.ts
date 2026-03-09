import { Controller } from "@decorators/controller";
import { ContentController } from "../content/controller";
import { Certification } from "./entity";
import { CertificationService } from "./service";
import { Container } from "@decorators/di-container";

/**
 * REST API controller for the {@link Certification} entity, mounted at `/api/certification`.
 *
 * Inherits standard CRUD route handling from {@link ContentController} and
 * wires up the {@link CertificationService} as the underlying data service via DI.
 */
@Controller("/api/certification")
export class CertificationController extends ContentController<Certification>
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
