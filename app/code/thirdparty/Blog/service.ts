import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Blog } from "./entity";
import { OnInit } from "@decorators/di-container";
import fs from 'fs'

@Service()
export class BlogService extends ContentService<Blog> implements OnInit
{
    protected getCollectionName(): string {
        return "blog"
    }
    
    public async onInit()
    {
        await super.onInit();

        if (!fs.existsSync('content/blog.json'))
        {
            fs.writeFileSync('content/blog.json', `{
    "component": "Blog/Index",
    "data": {},
    "children": [],
    "pageTitle": "Blog"
}`);
        }
    }
}
