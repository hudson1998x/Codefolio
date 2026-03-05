import React from "react";

export interface MediaNode {
    name: string;
    type: "file" | "directory";
    url?: string;
    children?: MediaNode[];
    path?: string;
}

interface MediaTreeProps {
    nodes: MediaNode[];
    onNodeClick: (node: MediaNode) => void;
    onRightClick: (node: MediaNode, event: React.MouseEvent) => void;
}

export const MediaTree: React.FC<MediaTreeProps> = ({ nodes, onNodeClick, onRightClick }) => {
    
    const getFileIcon = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase() || '';
        
        // Image formats
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return "🖼️";
        // Video formats
        if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return "🎬";
        // Audio formats
        if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return "🎵";
        // Code/Data
        if (['json', 'js', 'ts', 'tsx', 'html', 'css'].includes(ext)) return "📜";
        // Archives
        if (['zip', 'rar', '7z'].includes(ext)) return "📦";
        
        return "📄"; // Default file icon
    };

    const renderNode = (node: MediaNode) => (
        <li key={node.path} className={`tree-node ${node.type}`}>
            <div 
                className="node-label" 
                onClick={() => onNodeClick(node)}
                onContextMenu={(e) => onRightClick(node, e)}
            >
                <span className="icon">
                    {node.type === "directory" ? "📁" : getFileIcon(node.name)}
                </span>
                <span className="name">{node.name}</span>
            </div>
            
            {/* Hierarchical Recursion */}
            {node.children && node.children.length > 0 && (
                <ul>
                    {node.children.map(renderNode)}
                </ul>
            )}
        </li>
    );

    return (
        <ul className="media-tree-root">
            {nodes.map(renderNode)}
        </ul>
    );
};