import { CanvasNode } from "./frontend/types"


export const canvasAsPage = (node: CanvasNode, pageData: Record<string, any>): CanvasNode => {
    Object.assign(node, pageData);
    return node;
}