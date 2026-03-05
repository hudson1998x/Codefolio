import { Controller } from "@decorators/controller";
import { ContentController } from "../content/controller";
import { Prefab } from "./entity";
import { PrefabService } from "./service";
import { Container } from "@decorators/di-container";

/**
 * REST API controller for the {@link Prefab} entity, mounted at `/api/prefab`.
 *
 * Inherits standard CRUD route handling from {@link ContentController} and
 * wires up the {@link PrefabService} as the underlying data service via DI.
 */
@Controller("/api/prefab")
export class PrefabController extends ContentController<Prefab>
{
    /**
     * The service instance used for all data operations on {@link Prefab} entities.
     * Resolved automatically from the DI container.
     */
    protected service: PrefabService = Container.resolve(PrefabService);

    /**
     * Returns the {@link Prefab} entity constructor, used by the base controller
     * to introspect field metadata via `@Entity` decorators.
     *
     * @returns The {@link Prefab} class reference.
     */
    public getTargetEntity(): Function {
        return Prefab;
    }
}
