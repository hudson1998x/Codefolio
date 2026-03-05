import React, { useEffect, useState } from "react";
import { MediaTree, MediaNode } from "./media-tree";
import { registerComponent } from "@components/registry";

export interface MediaMiniExplorerProps {
    onSelect?: (node: MediaNode) => void;
}

export const MediaMiniExplorer: React.FC<MediaMiniExplorerProps> = ({ onSelect }) => {
    const [tree, setTree] = useState<MediaNode[]>([]);
    const [loading, setLoading] = useState(true);

    const buildPaths = (nodes: any[], parentPath = ""): MediaNode[] =>
        nodes.map(node => ({
            ...node,
            path: parentPath ? `${parentPath}/${node.name}` : node.name,
            children: node.children ? buildPaths(node.children, parentPath ? `${parentPath}/${node.name}` : node.name) : []
        }));

    const refresh = async () => {
        try {
            const res = await fetch("/api/media/list");
            const data = await res.json();
            setTree(buildPaths(data));
        } catch (err) {
            console.error("IDE Tree failed to load", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refresh(); }, []);

    return (
        <div className="mini-ide-explorer">
            <div className="explorer-header">
                <span>EXPLORER</span>
                <button className="refresh-icon" onClick={refresh}>🔄</button>
            </div>
            
            <div className="explorer-content">
                {loading ? (
                    <div className="loading-state">Loading...</div>
                ) : (
                    <MediaTree
                        enablePreview
                        collapseByDefault={true}
                        nodes={tree}
                        onNodeClick={(node) => onSelect?.(node)}
                        onRightClick={() => { /* Handle IDE-style context menu if needed */ }}
                    />
                )}
            </div>
        </div>
    );
};

registerComponent({
    name: 'MediaMiniExplorer',
    component: MediaMiniExplorer as any,
    defaults: {}
});