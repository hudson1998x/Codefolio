import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Certification } from "./entity";
import { Container } from "@decorators/di-container";
import { AdminNavService } from "../adminnav";
import { ConfigService } from "../configuration/service";

@Service()
export class CertificationService extends ContentService<Certification>
{
    public async onInit(): Promise<void> 
    {
        const adminNavService: AdminNavService = Container.resolve(AdminNavService);
        const configService = Container.resolve(ConfigService);

        const { platformConfig } = await configService.getConfig();

        if (platformConfig.mode == 'portfolio')
        {
            adminNavService.add({
                label: 'Certifications',
                href: '/en-admin/certification',
                key: 'certifications',
                parent: 'CV'
            })
        }
    }
    protected getCollectionName(): string {
        return "certification"
    }
}
