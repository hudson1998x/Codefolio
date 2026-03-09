import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Employment } from "./entity";
import { Container } from "@decorators/di-container";
import { AdminNavService } from "../adminnav";
import { ConfigService } from "../configuration/service";

@Service()
export class EmploymentService extends ContentService<Employment>
{

    public async onInit(): Promise<void> 
    {
        const adminNavService: AdminNavService = Container.resolve(AdminNavService);
        const configService = Container.resolve(ConfigService);

        const { platformConfig } = await configService.getConfig();

        if (platformConfig.mode == 'portfolio')
        {
            adminNavService.add({
                label: 'Employments',
                href: '/en-admin/employment',
                key: 'employments',
                parent: 'CV'
            })
        }
    }

    protected getCollectionName(): string {
        return "employment"
    }
}
