import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Page } from "./entity";

@Service()
export class PageService extends ContentService<Page>
{
    protected getCollectionName(): string {
        return "page"
    }
}