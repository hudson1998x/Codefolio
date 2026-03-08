/** @jsx h */
/** @jsxFrag Fragment */
import { Controller } from "@decorators/controller";
import { Get, Post } from "@decorators/routes";
import { CanvasNode } from "../../frontend/types";
import { ModuleGenerator, ServiceEntityField } from "./service";
import { Container } from "@decorators/di-container";
import { Request, Response } from "express";

/**
 * Request body expected by {@link ModuleGenerationController.create}.
 */
interface CreateModuleBody {
    /** PascalCase module name (e.g. `"BlogPost"`). */
    name: string;
    /** Field definitions to scaffold onto the entity. */
    fields: ServiceEntityField[];
    /**
     * When `true`, writes to `app/code/thirdparty/` instead of `app/code/user/`.
     * @default false
     */
    isThirdParty?: boolean;
}

/**
 * Response shape returned by {@link ModuleGenerationController.create}.
 */
interface CreateModuleResponse {
    success: boolean;
    /** Resolved output path on success. */
    path?: string;
    /** Error message on failure. */
    message?: string;
}

/**
 * Admin controller for the module scaffolding tool, mounted at
 * `content/en-admin/dev/generator`.
 *
 * Exposes a UI page and a REST endpoint for generating fully wired
 * entity/service/controller/admincontroller modules in one shot.
 */
@Controller("content/en-admin/dev/generator")
export class ModuleGenerationController
{
    private service: ModuleGenerator = Container.resolve(ModuleGenerator);

    /**
     * Renders the Module Generator admin UI page.
     * Registered as a nav item under the "Dev Tools" category.
     */
    @Get("add/page.json")
    public async addPage(): Promise<CanvasNode>
    {
        return (
            <ui-DevModuleGenerator>
                
            </ui-DevModuleGenerator>
        )
    }

    /**
     * Scaffolds a new module from the provided name and field definitions.
     *
     * Writes five files to the target directory:
     * `entity.ts`, `service.ts`, `controller.ts`, `admincontroller.ts`, `index.ts`.
     *
     * @returns `{ success: true, path }` on success, or `{ success: false, message }` on failure.
     */
    @Post("create")
    public async create(req: Request<{}, CreateModuleResponse, CreateModuleBody>, res: Response<CreateModuleResponse>): Promise<void>
    {
        const { name, fields, isThirdParty = false } = req.body;

        try {
            await this.service.createModule(name, fields, isThirdParty);

            const targetPath = isThirdParty
                ? `app/code/thirdparty/${name}`
                : `app/code/user/${name}`;

            res.json({ success: true, path: targetPath });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            res.status(500).json({ success: false, message });
        }
    }
}