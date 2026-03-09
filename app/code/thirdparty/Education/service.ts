import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Education } from "./entity";
import { Container } from "@decorators/di-container";
import { AdminNavService } from "../adminnav";
import { ConfigService } from "../configuration/service";

@Service()
export class EducationService extends ContentService<Education>
{
    public async onInit(): Promise<void> 
    {
        const adminNavService: AdminNavService = Container.resolve(AdminNavService);
        const configService = Container.resolve(ConfigService);

        const { platformConfig } = await configService.getConfig();

        if (platformConfig.mode == 'portfolio')
        {
            adminNavService.add({
                label: 'Education',
                href: '/en-admin/education',
                key: 'education',
                parent: 'CV'
            })
        }
    }
    protected getCollectionName(): string {
        return "education"
    }
}
