import { Container, OnInit } from "@decorators/di-container";
import { Service } from "@decorators/service";
import fs from 'fs'
import { ConfigService } from "../configuration/service";

@Service()
export class CvService implements OnInit
{
    public async onInit(): Promise<void> 
    {
        const configService = Container.resolve(ConfigService);
        
        const { platformConfig } = await configService.getConfig();

        if (platformConfig.mode !== 'portfolio')
        {
            return;
        }

        if (!fs.existsSync('content'))
        {
            fs.mkdirSync('content');
        }
        fs.writeFileSync('content/cv.json', JSON.stringify({
            component: '@pages/cv-preview',
            data: {},
            children: [],
            pageTitle: "CV"
        }))
    }
}