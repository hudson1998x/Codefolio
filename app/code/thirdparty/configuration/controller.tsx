import { Controller } from "@decorators/controller";
import { Get, Post } from "@decorators/routes";
import { CanvasNode } from "../frontend/types";
import { AdminNavItem } from "@decorators/admin-nav";
import { ConfigService } from "./service";
import { Container } from "@decorators/di-container";
import { Request, Response } from "express";
import { canvasAsPage } from "../utils";
import { ThemeData } from "./types";
import fs from 'fs'
import path from 'path'

@Controller("content/en-admin/configuration")
export class ConfigController
{
    private service: ConfigService;

    public constructor()
    {
        this.service = Container.resolve(ConfigService);
    }

    @Get("edit/page.json")
    @AdminNavItem("Site Settings")
    public async editPage(): Promise<CanvasNode>
    {
        const data: Record<string, any> = await this.service.getConfig();

        return canvasAsPage(
            <ui-Form
                method="POST"
                endpoint="/content/en-admin/configuration/save"
            >
                <ui-Section title="Site Settings" className="site-config">
                    <ui-Section>
                        <ui-Button variant="primary" type="submit">Save changes</ui-Button>
                    </ui-Section>
                    {Object.keys(data).sort((a, b) => b.localeCompare(a)).map((cfgKey) => {
                        const config = data[cfgKey];

                        if (config?.component) {
                            return (
                                <ui-Section
                                    key={cfgKey}
                                    title={cfgKey}
                                    align="left"
                                    background="muted"
                                    className=""
                                >
                                    {{
                                        component: config.component,
                                        data: config,
                                        children: []
                                    } as CanvasNode}
                                </ui-Section>
                            );
                        }

                        return (
                            <ui-Section
                                key={cfgKey}
                                title={cfgKey}
                                align="left"
                                background="muted"
                                className=""
                            >
                                {Object.keys(config).map((fieldKey) => {
                                    const value = config[fieldKey];

                                    if (typeof value === "object") return null;

                                    return (
                                        <ui-Input
                                            key={fieldKey}
                                            name={`${cfgKey}[${fieldKey}]`}
                                            kind="input"
                                            label={fieldKey}
                                            type={typeof value === "boolean" ? "checkbox" : "text"}
                                            defaultValue={String(value)}
                                            placeholder=""
                                            required={false}
                                            disabled={false}
                                            options={[]}
                                        />
                                    );
                                })}
                            </ui-Section>
                        );
                    })}
                </ui-Section>
            </ui-Form>,
            {
                pageTitle: 'Manage site settings'
            }
        );
    }

    @Post("save")
    public async save(req: Request, res: Response): Promise<void>
    {
        const merged = await this.service.updateConfig(req.body);
        res.json({ ok: true, config: merged });
    }

    @Get("themes")
    public async listThemes(req: Request, res: Response): Promise<ThemeData[]> {
        const themes: ThemeData[] = [];

        const themeDir = 'app/web/themes';
        const files: string[] = fs.readdirSync(themeDir);

        files.forEach((folder) => {
            const basePath = path.join(themeDir, folder);
            const themeJsonPath = path.join(basePath, 'theme.json');

            if (!fs.existsSync(themeJsonPath)) {
                return; // skip folders without theme.json
            }

            try {
                const raw = fs.readFileSync(themeJsonPath, 'utf-8');
                const parsed: ThemeData = JSON.parse(raw);

                parsed.key = folder;

                // Optional: validate required fields
                if (parsed.name && parsed.vendor && parsed.version) {
                    themes.push(parsed);
                } else {
                    console.warn(`Theme in folder "${folder}" is missing required fields.`);
                }
            } catch (err) {
                console.error(`Failed to read theme in folder "${folder}":`, err);
            }
        });

        return themes;
    }
}