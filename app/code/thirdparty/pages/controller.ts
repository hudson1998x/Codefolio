import { Controller } from "@decorators/controller";
import { ContentController } from "../content/controller";
import { Page } from "./entity";
import { PageService } from "./service";
import { Container } from "@decorators/di-container";

@Controller("/api/page")
export class PageController extends ContentController<Page>
{
    protected service: PageService = Container.resolve(PageService);

}