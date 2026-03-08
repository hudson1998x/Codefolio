import { Container } from "@decorators/di-container";
import { AdminController } from "../content/admincontroller";
import { Projects } from "./entity";
import { ProjectsService } from "./service";
import { Controller } from "@decorators/controller";

/**
 * Admin controller for the {@link Projects} entity, mounted at `content/en-admin/projects`.
 *
 * Inherits list, edit, and add page rendering from {@link AdminController} and
 * wires up the {@link ProjectsService} as the underlying data service via DI.
 */
@Controller('content/en-admin/projects')
export class ProjectsAdminController extends AdminController<Projects>
{
    /**
     * The service instance used for all data operations on {@link Projects} entities.
     * Resolved automatically from the DI container.
     */
    protected service: ProjectsService = Container.resolve(ProjectsService);

    /**
     * Returns the {@link Projects} entity constructor, used by the base controller
     * to introspect field metadata via `@Entity` decorators.
     *
     * @returns The {@link Projects} class reference.
     */
    public getTargetEntity(): Function {
        return Projects;
    }
}
