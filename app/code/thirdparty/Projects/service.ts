import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Projects } from "./entity";
import { Container, OnInit } from "@decorators/di-container";
import fs from 'fs'
import { CanvasNode } from "../frontend/types";
import { canvasAsPage } from "../utils";
import { AdminNavService } from "../adminnav";
import { ConfigService } from "../configuration/service";

@Service()
export class ProjectsService extends ContentService<Projects> implements OnInit
{

    public async onInit(): Promise<void> {
        await super.onInit();

        const adminNavService: AdminNavService = Container.resolve(AdminNavService);
        const configService: ConfigService = Container.resolve(ConfigService);
        const configRoot = await configService.getConfig();
        
        const { platformConfig } = configRoot;
    
        adminNavService.add({
            label: 'My Projects',
            href: '/en-admin/projects',
            key: 'my_projects',
            parent: platformConfig.mode === 'portfolio' ? 'CV' : undefined
        })

        if (!fs.existsSync('content'))
        {
            fs.mkdirSync('content');
        }
        if (!fs.existsSync('content/projects.json'))
        {

            const page: CanvasNode = {
                component: 'Presets/ProjectPage', 
                data: {},
                children: []
            }

            fs.writeFileSync('content/projects.json', JSON.stringify(canvasAsPage(page, {
                pageTitle: 'Projects'
            })));
        }
    }

    protected getCollectionName(): string {
        return "projects"
    }
}
