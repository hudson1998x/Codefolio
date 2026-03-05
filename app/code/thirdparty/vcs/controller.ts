/** @jsx h */
/** @jsxFrag Fragment */
import { Controller } from "@decorators/controller";
import { Get, Post } from "@decorators/routes";
import { CanvasNode } from "../frontend/types";
import { VcsService } from "./service";
import { Container } from "@decorators/di-container";
import { Request, Response } from "express";

@Controller("content/en-admin/vcs")
export class VcsController
{
    private service: VcsService;

    public constructor()
    {
        this.service = Container.resolve(VcsService);
    }

    @Get("status.json")
    public async getStatus(req: Request, res: Response): Promise<void>
    {
        const [status, lastCommit] = await Promise.all([
            this.service.getStatus(),
            this.service.getLastCommit(),
        ]);

        res.json({ status, lastCommit });
    }
}