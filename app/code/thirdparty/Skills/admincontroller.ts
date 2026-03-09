import { Container } from "@decorators/di-container";
import { AdminController } from "../content/admincontroller";
import { Skills } from "./entity";
import { SkillsService } from "./service";
import { Controller } from "@decorators/controller";

/**
 * Admin controller for the {@link Skills} entity, mounted at `content/en-admin/skills`.
 *
 * Inherits list, edit, and add page rendering from {@link AdminController} and
 * wires up the {@link SkillsService} as the underlying data service via DI.
 */
@Controller('content/en-admin/skills')
export class SkillsAdminController extends AdminController<Skills>
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
