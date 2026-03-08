import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Documents } from "./entity";
import { Container } from "@decorators/di-container";
import { AdminNavService } from "../adminnav";
import { ConfigService } from "../configuration/service";

@Service()
export class DocumentsService extends ContentService<Documents>
{
    public async onInit(): Promise<void> 
    {
        const configService: ConfigService = Container.resolve(ConfigService);
        const adminNavService: AdminNavService = Container.resolve(AdminNavService);
    
        const configRoot = await configService.getConfig();
        
        const { platformConfig } = configRoot;

        adminNavService.add({
            label: 'Documentation',
            href: '/en-admin/documents',
            key: 'documents',
            parent: platformConfig.mode === 'portfolio' ? 'CV' : undefined
        })    
    }
    protected getCollectionName(): string {
        return "documents"
    }
}
