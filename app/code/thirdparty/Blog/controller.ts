import { Controller } from "@decorators/controller";
import { ContentController } from "../content/controller";
import { Blog } from "./entity";
import { BlogService } from "./service";
import { Container } from "@decorators/di-container";

/**
 * REST API controller for the {@link Blog} entity, mounted at `/api/blog`.
 *
 * Inherits standard CRUD route handling from {@link ContentController} and
 * wires up the {@link BlogService} as the underlying data service via DI.
 */
@Controller("/api/blog")
export class BlogController extends ContentController<Blog>
{
    /**
     * The service instance used for all data operations on {@link Blog} entities.
     * Resolved automatically from the DI container.
     */
    protected service: BlogService = Container.resolve(BlogService);

    /**
     * Returns the {@link Blog} entity constructor, used by the base controller
     * to introspect field metadata via `@Entity` decorators.
     *
     * @returns The {@link Blog} class reference.
     */
    public getTargetEntity(): Function {
        return Blog;
    }
}
