import { Controller } from "@decorators/controller";
import { ContentController } from "../content/controller";
import { Skills } from "./entity";
import { SkillsService } from "./service";
import { Container } from "@decorators/di-container";

/**
 * REST API controller for the {@link Skills} entity, mounted at `/api/skills`.
 *
 * Inherits standard CRUD route handling from {@link ContentController} and
 * wires up the {@link SkillsService} as the underlying data service via DI.
 */
@Controller("/api/skills")
export class SkillsController extends ContentController<Skills>
{
    /**
     * The service instance used for all data operations on {@link Skills} entities.
     * Resolved automatically from the DI container.
     */
    protected service: SkillsService = Container.resolve(SkillsService);

    /**
     * Returns the {@link Skills} entity constructor, used by the base controller
     * to introspect field metadata via `@Entity` decorators.
     *
     * @returns The {@link Skills} class reference.
     */
    public getTargetEntity(): Function {
        return Skills;
    }
}
