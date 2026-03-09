import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Skills } from "./entity";
import { AdminNavService } from "../adminnav";
import { Container } from "@decorators/di-container";
import { ConfigService } from "../configuration/service";

@Service()
export class SkillsService extends ContentService<Skills>
{

    public async onInit(): Promise<void> 
    {
        const adminNavService: AdminNavService = Container.resolve(AdminNavService);
        const configService = Container.resolve(ConfigService);

        const { platformConfig } = await configService.getConfig();

        if (platformConfig.mode == 'portfolio')
        {
            adminNavService.add({
                label: 'Skills',
                href: '/en-admin/skills',
                key: 'skills',
                parent: 'CV'
            })
        }
    }

    protected getCollectionName(): string {
        return "skills"
    }
}
