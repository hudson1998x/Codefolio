import { Controller } from "@decorators/controller";
import { ContentController } from "../content/controller";
import { Projects } from "./entity";
import { ProjectsService } from "./service";
import { Container } from "@decorators/di-container";

/**
 * REST API controller for the {@link Projects} entity, mounted at `/api/projects`.
 *
 * Inherits standard CRUD route handling from {@link ContentController} and
 * wires up the {@link ProjectsService} as the underlying data service via DI.
 */
@Controller("/api/projects")
export class ProjectsController extends ContentController<Projects>
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
