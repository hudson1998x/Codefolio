import React, { useState } from "react";

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
    enablePreview?: boolean;
    collapseByDefault?: boolean
}

// Sub-component to manage internal collapse state per folder
const MediaTreeNode: React.FC<{
    node: MediaNode;
    onNodeClick: (node: MediaNode) => void;
    onRightClick: (node: MediaNode, event: React.MouseEvent) => void;
    enablePreview: boolean;
    getFileIcon: (node: MediaNode) => React.ReactNode;
    collapseByDefault?: boolean
}> = ({ node, onNodeClick, onRightClick, enablePreview, getFileIcon, collapseByDefault = false }) => {
    const [isExpanded, setIsExpanded] = useState(() => {
        return collapseByDefault ? false : true
    });

    const handleToggle = (e: React.MouseEvent) => {
        if (node.type === "directory") {
            e.stopPropagation(); // Don't trigger selection if just toggling
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <li title={`/media/${node.path}`} className={`tree-node ${node.type} ${enablePreview ? 'as-grid-item' : 'as-tree-item'}`}>
            <div 
                className={`node-label ${!isExpanded ? 'collapsed' : ''}`}
                onClick={(e) => node.type === 'directory' ? handleToggle(e as any) : onNodeClick(node)}
                onDoubleClick={() => node.type === 'directory' && onNodeClick(node)}
                onContextMenu={(e) => onRightClick(node, e)}
            >
                {node.type === "directory" && !enablePreview && (
                    <span className={`chevron ${isExpanded ? 'open' : ''}`} onClick={handleToggle}>
                        ▶
                    </span>
                )}
                
                <div className="icon-container">
                    {node.type === "directory" ? (isExpanded ? "📂" : "📁") : getFileIcon(node)}
                </div>
                <span className="name-overlay">{node.name}</span>
            </div>
            
            {isExpanded && node.children && node.children.length > 0 && (
                <ul className={enablePreview ? "sub-grid" : "node-children"}>
                    {node.children.map(child => (
                        <MediaTreeNode 
                            collapseByDefault={collapseByDefault}
                            key={child.path}
                            node={child} 
                            onNodeClick={onNodeClick} 
                            onRightClick={onRightClick}
                            enablePreview={enablePreview}
                            getFileIcon={getFileIcon}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

export const MediaTree: React.FC<MediaTreeProps> = (props) => {
    const isImage = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase() || '';
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
    };

    const getFileIcon = (node: MediaNode) => {
        if (props.enablePreview && isImage(node.name)) {
            return <img src={`/media/${node.path}`} alt={node.name} className="preview-image" loading="lazy" />;
        }
        const ext = node.name.split('.').pop()?.toLowerCase() || '';
        if (['mp4', 'webm', 'mov'].includes(ext)) return "🎬";
        if (['mp3', 'wav', 'ogg'].includes(ext)) return "🎵";
        return "📄"; 
    };

    return (
        <ul className={`media-tree-root ${props.enablePreview ? 'grid-layout' : 'tree-layout'}`}>
            {props.nodes.map(node => (
                <MediaTreeNode 
                    key={node.path} 
                    node={node} 
                    {...props} 
                    getFileIcon={getFileIcon} 
                    enablePreview={props.enablePreview || false}
                />
            ))}
        </ul>
    );
};