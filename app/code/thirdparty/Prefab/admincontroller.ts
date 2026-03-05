import { Container } from "@decorators/di-container";
import { AdminController } from "../content/admincontroller";
import { Prefab } from "./entity";
import { PrefabService } from "./service";
import { Controller } from "@decorators/controller";

/**
 * Admin controller for the {@link Prefab} entity, mounted at `content/en-admin/prefab`.
 *
 * Inherits list, edit, and add page rendering from {@link AdminController} and
 * wires up the {@link PrefabService} as the underlying data service via DI.
 */
@Controller('content/en-admin/prefab')
export class PrefabAdminController extends AdminController<Prefab>
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
