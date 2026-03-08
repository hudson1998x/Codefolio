import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Page } from "./entity";
import { Container } from "@decorators/di-container";
import { AdminNavService } from "../adminnav";

@Service()
export class PageService extends ContentService<Page>
{
    public async onInit(): Promise<void> 
    {
        const adminNavService: AdminNavService = Container.resolve(AdminNavService);

        adminNavService.add({
            label: 'Pages',
            href: '/en-admin/page',
            key: 'pages',
            parent: 'Content Management'
        })
    }
    protected getCollectionName(): string {
        return "page"
    }
}