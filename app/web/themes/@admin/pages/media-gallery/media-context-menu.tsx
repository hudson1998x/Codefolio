import React from "react";
import { MediaNode } from "./media-tree";

interface Props {
    node: MediaNode | null;
    x: number;
    y: number;
    onClose: () => void;
    onRefresh: () => void;
    onDelete?: () => void;
    onCreateFolder: () => void;
    onUpload: () => void;
}

export const MediaContextMenu: React.FC<Props> = ({ 
    node, x, y, onClose, onRefresh, onDelete, onCreateFolder, onUpload 
}) => {
    const isFile = node?.type === 'file';

    return (
        <>
            <div className="context-menu-backdrop" onClick={onClose} onContextMenu={(e) => {e.preventDefault(); onClose();}} />
            <div className="media-context-menu" style={{ top: y, left: x }}>
                <div className="menu-header">
                    {node ? `${node.type === 'directory' ? '📁' : '📄'} ${node.name}` : "Folder Actions"}
                </div>
                
                <button onClick={() => { onCreateFolder(); onClose(); }}>
                    📁 New Folder
                </button>
                
                <button onClick={() => { onUpload(); onClose(); }}>
                    📤 Upload Here
                </button>

                {node && (
                    <>
                        <hr />
                        <button onClick={() => { alert('Rename functionality'); onClose(); }}>✏️ Rename</button>
                        <button className="danger" onClick={() => { onDelete?.(); onClose(); }}>
                            🗑️ Delete
                        </button>
                    </>
                )}
                
                <hr />
                <button onClick={() => { onRefresh(); onClose(); }}>
                    🔄 Refresh
                </button>
            </div>
        </>
    );
};