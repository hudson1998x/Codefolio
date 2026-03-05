import { Container } from "@decorators/di-container";
import { AdminController } from "../content/admincontroller";
import { Blog } from "./entity";
import { BlogService } from "./service";
import { Controller } from "@decorators/controller";

/**
 * Admin controller for the {@link Blog} entity, mounted at `content/en-admin/blog`.
 *
 * Inherits list, edit, and add page rendering from {@link AdminController} and
 * wires up the {@link BlogService} as the underlying data service via DI.
 */
@Controller('content/en-admin/blog')
export class BlogAdminController extends AdminController<Blog>
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
