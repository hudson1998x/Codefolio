import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Achievement } from "./entity";
import { Container } from "@decorators/di-container";
import { AdminNavService } from "../adminnav";
import { ConfigService } from "../configuration/service";

@Service()
export class AchievementService extends ContentService<Achievement>
{
    public async onInit(): Promise<void> 
    {
        const adminNavService: AdminNavService = Container.resolve(AdminNavService);
        const configService = Container.resolve(ConfigService);

        const { platformConfig } = await configService.getConfig();

        if (platformConfig.mode == 'portfolio')
        {
            adminNavService.add({
                label: 'Achievements',
                href: '/en-admin/achievement',
                key: 'achievements',
                parent: 'CV'
            })
        }
    }
    protected getCollectionName(): string {
        return "achievement"
    }
}
