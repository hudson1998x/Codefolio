import { Controller } from '@decorators/controller';
import { Post, Get, Delete } from '@decorators/routes';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { Container } from '@decorators/di-container';
import { VcsService } from '../vcs/service';

@Controller("/api/media")
export class MediaController {
    private mediaDir = path.join(process.cwd(), 'media'); // root://media

    constructor() {
        fs.mkdirSync(this.mediaDir, { recursive: true });
    }

    /** Upload files */
    @Post("upload")
    public async upload(req: Request, res: Response): Promise<Response> {
        return new Promise((resolve, reject) => {
            const contentType = req.headers['content-type'];
            if (!contentType || !contentType.includes('multipart/form-data')) {
                return resolve(res.status(400).json({ error: "Invalid Content-Type" }));
            }

            const gitSvc: VcsService = Container.resolve(VcsService);

            const boundaryMatch = contentType.match(/boundary=(.+)$/);
            if (!boundaryMatch) return resolve(res.status(400).json({ error: "No boundary" }));

            const boundary = `--${boundaryMatch[1]}`;
            let buffer = Buffer.alloc(0);
            const uploadedFiles: string[] = [];
            let targetSubDir = ""; // Default to root

            req.on('data', (chunk: Buffer) => {
                buffer = Buffer.concat([buffer, chunk]);
                let boundaryIndex;

                while ((boundaryIndex = buffer.indexOf(boundary)) >= 0) {
                    const part = buffer.slice(0, boundaryIndex);
                    buffer = buffer.slice(boundaryIndex + boundary.length);
                    if (part.length === 0) continue;

                    const partStr = part.toString();

                    // 1. Check if this part is the "path" field
                    if (partStr.includes('name="path"')) {
                        const pathMatch = partStr.match(/\r\n\r\n([\s\S]*?)\r\n$/);
                        if (pathMatch) targetSubDir = pathMatch[1].trim();
                        continue;
                    }

                    // 2. Check if this part is a file
                    const filenameMatch = partStr.match(/filename="(.+?)"/);
                    const fileDataMatch = part.indexOf(Buffer.from('\r\n\r\n'));
                    
                    if (filenameMatch && fileDataMatch !== -1) {
                        const filename = path.basename(filenameMatch[1]);
                        // Slice the buffer exactly to avoid string encoding issues with binaries
                        const fileData = part.slice(fileDataMatch + 4, part.lastIndexOf(Buffer.from('\r\n')));
                        
                        const safeName = `${Date.now()}-${filename}`;
                        
                        // Resolve the final directory
                        const uploadDir = path.join(this.mediaDir, targetSubDir);
                        
                        // Safety check to prevent escaping mediaDir
                        if (!uploadDir.startsWith(this.mediaDir)) continue;

                        if (!fs.existsSync(uploadDir)) {
                            fs.mkdirSync(uploadDir, { recursive: true });
                        }

                        const filePath = path.join(uploadDir, safeName);
                        fs.writeFileSync(filePath, fileData);

                        gitSvc.addFile(filePath);
                        uploadedFiles.push(path.join(targetSubDir, safeName));
                    }
                }
            });

            req.on('end', () => resolve(res.json({ uploadedFiles })));
            req.on('error', (err) => reject(res.status(500).json({ error: err.message })));
        });
    }


    /** Create folder */
    @Post("create-folder")
    public createFolder(req: Request, res: Response): Response {
        const { path: folderPath } = req.body;
        if (!folderPath || typeof folderPath !== 'string') {
            return res.status(400).json({ error: "Folder path is required" });
        }

        const safePath = path.join(this.mediaDir, folderPath);
        if (!safePath.startsWith(this.mediaDir)) {
            return res.status(400).json({ error: "Invalid folder path" });
        }

        try {
            fs.mkdirSync(safePath, { recursive: true });
            return res.json({ success: true, folder: safePath });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    /** List media tree */
    @Get("list")
    public list(req: Request, res: Response): Response {
        const walk = (dir: string): any[] => {
            return fs.readdirSync(dir, { withFileTypes: true }).map(entry => {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(this.mediaDir, fullPath).replace(/\\/g, '/');
                const urlPath = `/media/${relativePath}`;

                if (entry.isDirectory()) {
                    return {
                        name: entry.name,
                        type: 'directory',
                        children: walk(fullPath)
                    };
                } else {
                    const stat = fs.statSync(fullPath);
                    return {
                        name: entry.name,
                        type: 'file',
                        size: stat.size,
                        mime: mime.lookup(fullPath) || 'unknown',
                        url: urlPath
                    };
                }
            });
        };

        try {
            const tree = walk(this.mediaDir);
            return res.json(tree);
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    /** Delete files/folders safely */
    @Delete("delete")
    public delete(req: Request, res: Response): Response {
        const files: string[] = req.body.files;
        if (!Array.isArray(files)) {
            return res.status(400).json({ error: "files must be an array of strings" });
        }

        const deleted: string[] = [];
        const skipped: string[] = [];

        for (let f of files) {
            const safePath = path.join(this.mediaDir, f);
            if (!safePath.startsWith(this.mediaDir)) {
                skipped.push(f);
                continue;
            }

            try {
                if (fs.existsSync(safePath)) {
                    const stat = fs.statSync(safePath);
                    if (stat.isDirectory()) fs.rmSync(safePath, { recursive: true });
                    else fs.unlinkSync(safePath);
                    deleted.push(f);
                } else skipped.push(f);
            } catch (err) {
                skipped.push(f);
            }
        }

        return res.json({ deleted, skipped });
    }
}