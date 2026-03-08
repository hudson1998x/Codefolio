import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Projects } from "./entity";
import { OnInit } from "@decorators/di-container";
import fs from 'fs'
import { CanvasNode } from "../frontend/types";
import { canvasAsPage } from "../utils";

@Service()
export class ProjectsService extends ContentService<Projects> implements OnInit
{

    public async onInit(): Promise<void> {
        await super.onInit();

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
