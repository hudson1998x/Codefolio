import { Container } from "@decorators/di-container";
import { AdminController } from "../content/admincontroller";
import { Achievement } from "./entity";
import { AchievementService } from "./service";
import { Controller } from "@decorators/controller";

/**
 * Admin controller for the {@link Achievement} entity, mounted at `content/en-admin/achievement`.
 *
 * Inherits list, edit, and add page rendering from {@link AdminController} and
 * wires up the {@link AchievementService} as the underlying data service via DI.
 */
@Controller('content/en-admin/achievement')
export class AchievementAdminController extends AdminController<Achievement>
{
    /**
     * The service instance used for all data operations on {@link Achievement} entities.
     * Resolved automatically from the DI container.
     */
    protected service: AchievementService = Container.resolve(AchievementService);

    /**
     * Returns the {@link Achievement} entity constructor, used by the base controller
     * to introspect field metadata via `@Entity` decorators.
     *
     * @returns The {@link Achievement} class reference.
     */
    public getTargetEntity(): Function {
        return Achievement;
    }
}
