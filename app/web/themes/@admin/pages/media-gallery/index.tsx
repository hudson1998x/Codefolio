import React, { useEffect, useState, useMemo } from "react";
import { MediaTree, MediaNode } from "./media-tree";
import { MediaContextMenu } from "./media-context-menu";
import { FileUploader } from "@components/file-upload";
import { registerComponent } from "@components/registry";
import './style.scss';

export const MediaGalleryPage: React.FC = () => {
    const [tree, setTree] = useState<MediaNode[]>([]);
    const [history, setHistory] = useState<MediaNode[]>([]);
    const [selectedNode, setSelectedNode] = useState<MediaNode | null>(null);
    const [contextMenu, setContextMenu] = useState<{ node: MediaNode | null, x: number, y: number } | null>(null);
    const [uploadTarget, setUploadTarget] = useState<MediaNode | null>(null);
    const [previewNode, setPreviewNode] = useState<MediaNode | null>(null);

    // --- Core Logic ---

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
            console.error("Failed to fetch media tree", err);
        }
    };

    useEffect(() => { refresh(); }, []);

    const currentFolder = useMemo(() => history[history.length - 1] || null, [history]);
    const currentItems = useMemo(() => currentFolder ? currentFolder.children || [] : tree, [tree, currentFolder]);

    // --- Action Handlers ---

    const handleCreateFolder = async (targetNode?: MediaNode | null) => {
        const name = prompt("Enter folder name:");
        if (!name) return;
        
        const effectiveParent = targetNode?.type === 'directory' ? targetNode : currentFolder;
        const fullPath = effectiveParent?.path ? `${effectiveParent.path}/${name}` : name;

        try {
            await fetch("/api/media/create-folder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: fullPath })
            });
            refresh();
        } catch (err) {
            console.error("Failed to create folder", err);
        }
    };

    const handleDelete = async (node: MediaNode) => {
        if (!confirm(`Delete ${node.name}?`)) return;
        try {
            await fetch("/api/media/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ files: [node.path] })
            });
            if (selectedNode?.path === node.path) setSelectedNode(null);
            refresh();
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    const handleNodeClick = (node: MediaNode) => {
        setSelectedNode(node);
        if (node.type === 'file') {
            const ext = node.name.split('.').pop()?.toLowerCase() || '';
            const previewable = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mp3', 'wav', 'ogg'];
            if (previewable.includes(ext)) {
                setPreviewNode(node);
            }
        } else {
            setHistory([...history, node]);
        }
    };

    const onGlobalContextMenu = (e: React.MouseEvent, node: MediaNode | null = null) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ node, x: e.clientX, y: e.clientY });
    };

    // --- Preview Renderer ---

    const renderPreviewContent = (node: MediaNode) => {
        const url = `/media/${node.path}`; 
        const ext = node.name.split('.').pop()?.toLowerCase() || '';

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            return <img src={url} alt={node.name} className="preview-media" />;
        }
        if (['mp4', 'webm'].includes(ext)) {
            return <video src={url} controls autoPlay className="preview-media" />;
        }
        if (['mp3', 'wav', 'ogg'].includes(ext)) {
            return (
                <div className="audio-preview-container">
                    <div className="audio-icon">🎵</div>
                    <audio src={url} controls autoPlay />
                    <p>{node.name}</p>
                </div>
            );
        }
        return <div className="no-preview">No preview available.</div>;
    };

    return (
        <div className="explorer-app" onContextMenu={e => onGlobalContextMenu(e, currentFolder)}>
            <nav className="explorer-nav">
                <div className="breadcrumbs">
                    <span onClick={() => setHistory([])}>Root</span>
                    {history.map((node, i) => (
                        <span key={i} onClick={() => setHistory(history.slice(0, i + 1))}>
                            <span className="sep">/</span> {node.name}
                        </span>
                    ))}
                </div>
            </nav>

            <div className="explorer-main-area">
                <aside className="explorer-tree-sidebar">
                    <MediaTree
                        nodes={tree}
                        onNodeClick={handleNodeClick}
                        onRightClick={(n, e) => onGlobalContextMenu(e, n)}
                    />
                </aside>

                <main className="explorer-view grid" onContextMenu={e => onGlobalContextMenu(e, currentFolder)}>
                    {currentItems.map(item => {
                        const isImage = item.type === 'file' && 
                            ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(item.name.split('.').pop()?.toLowerCase() || '');
                        
                        return (
                            <div
                                key={item.path}
                                className={`item-card ${selectedNode?.path === item.path ? 'selected' : ''}`}
                                onClick={e => { e.stopPropagation(); setSelectedNode(item); }}
                                onDoubleClick={() => handleNodeClick(item)}
                                onContextMenu={e => onGlobalContextMenu(e, item)}
                            >
                                <div className="icon">
                                    {item.type === 'directory' ? (
                                        '📁'
                                    ) : isImage ? (
                                        <img 
                                            src={`/media/${item.path}`} 
                                            alt={item.name} 
                                            className="mini-thumbnail" 
                                        />
                                    ) : (
                                        '📄'
                                    )}
                                </div>
                                <div className="label">{item.name}</div>
                            </div>
                        );
                    })}
                </main>
            </div>

            {/* CONTEXT MENU */}
            {contextMenu && (
                <MediaContextMenu
                    node={contextMenu.node}
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onRefresh={refresh}
                    onDelete={contextMenu.node ? () => handleDelete(contextMenu.node!) : undefined}
                    onCreateFolder={() => handleCreateFolder(contextMenu.node)}
                    onUpload={() => setUploadTarget(contextMenu.node?.type === 'directory' ? contextMenu.node : currentFolder)}
                />
            )}

            {/* UPLOADER POPOVER */}
            {uploadTarget && (
                <div className="media-uploader-overlay" onClick={() => setUploadTarget(null)}>
                    <div className="media-uploader-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Upload to /{uploadTarget?.path || 'root'}</h3>
                            <button className="close-x" onClick={() => setUploadTarget(null)}>✕</button>
                        </div>
                        <FileUploader
                            multiple
                            basePath={uploadTarget?.path || ""}
                            onUploaded={() => { refresh(); setUploadTarget(null); }}
                        />
                    </div>
                </div>
            )}

            {/* PREVIEW POPOVER */}
            {previewNode && (
                <div className="media-preview-overlay" onClick={() => setPreviewNode(null)}>
                    <div className="media-preview-modal" onClick={e => e.stopPropagation()}>
                        <div className="preview-header">
                            <span className="file-title">{previewNode.name}</span>
                            <button className="close-x" onClick={() => setPreviewNode(null)}>✕</button>
                        </div>
                        <div className="preview-body">
                            {renderPreviewContent(previewNode)}
                        </div>
                        <div className="preview-footer">
                           <a href={`/media/${previewNode.path}`} download className="download-btn">Download File</a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

registerComponent({
    name: 'MediaGalleryPage',
    component: MediaGalleryPage as any,
    defaults: {}
});