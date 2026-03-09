import { Controller } from "@decorators/controller";
import { ContentController } from "../content/controller";
import { Achievement } from "./entity";
import { AchievementService } from "./service";
import { Container } from "@decorators/di-container";

/**
 * REST API controller for the {@link Achievement} entity, mounted at `/api/achievement`.
 *
 * Inherits standard CRUD route handling from {@link ContentController} and
 * wires up the {@link AchievementService} as the underlying data service via DI.
 */
@Controller("/api/achievement")
export class AchievementController extends ContentController<Achievement>
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
