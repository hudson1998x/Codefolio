import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Blog } from "./entity";

@Service()
export class BlogService extends ContentService<Blog>
{
    protected getCollectionName(): string {
        return "blog"
    }
}
