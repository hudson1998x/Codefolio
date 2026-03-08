import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Prefab } from "./entity";
import { AdminNavService } from "../adminnav";
import { Container } from "@decorators/di-container";

@Service()
export class PrefabService extends ContentService<Prefab>
{
    public async onInit(): Promise<void> 
    {
        const adminNavService: AdminNavService = Container.resolve(AdminNavService);

        adminNavService.add({
            label: 'Prefabs',
            href: '/en-admin/prefab',
            key: 'Prefabs',
            parent: 'Content Management'
        })
    }
    protected getCollectionName(): string {
        return "prefab"
    }
}
