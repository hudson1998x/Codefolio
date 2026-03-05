import { MediaNode } from "./media-tree";

const buildTreePaths = (nodes: any[], parentPath = ""): MediaNode[] => {
    return nodes.map(node => {
        const relativePath = parentPath ? `${parentPath}/${node.name}` : node.name;
        const newNode: MediaNode = {
            ...node,
            path: relativePath,
            children: node.children ? buildTreePaths(node.children, relativePath) : []
        };
        return newNode;
    });
};