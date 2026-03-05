import { Controller } from "@decorators/controller";
import { Post } from "@decorators/routes";
import { Request, Response } from "express";
import { VcsService } from "./service";
import { Container } from "@decorators/di-container";

@Controller("/api/git")
export class VcsApiController
{
    private service: VcsService = Container.resolve(VcsService)

    @Post("deploy")
    public async deploy(req: Request, res: Response): Promise<void> {
        const { message } = req.body;
        
        if (!message || message.trim().length === 0) {
            res.status(400).json({ error: "Commit message is required" });
            return;
        }

        try {
            await this.service.deploy(message);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}