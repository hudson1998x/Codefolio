import { useState } from "react";
import { CanvasNode, NodeId } from "./types";



export const BlueprintNode: React.FC<{
  node: CanvasNode;
  onDrop: (compName: string, targetId?: NodeId, position?: 'before' | 'inside', prefabData?: any) => void;
  onMove: (dragId: NodeId, targetId?: NodeId, position?: 'before' | 'inside') => void;
  onEdit: (id: NodeId) => void;
  onDelete: (id: NodeId) => void;
  isSelected: boolean;
}> = ({ node, onDrop, onMove, onEdit, onDelete, isSelected }) => {
  const [isOverTop, setIsOverTop] = useState(false);
  const [isOverInside, setIsOverInside] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData("dragNodeId", node.id);
  };

  const handleUniversalDrop = (e: React.DragEvent, position: 'before' | 'inside') => {
    e.preventDefault();
    e.stopPropagation();
    setIsOverTop(false);
    setIsOverInside(false);

    const dragId = e.dataTransfer.getData("dragNodeId");
    const compName = e.dataTransfer.getData("componentName");
    const rawPrefab = e.dataTransfer.getData("prefabData");

    if (dragId) {
      onMove(dragId, node.id, position);
    } else if (compName) {
      let pData = undefined;
      try { pData = rawPrefab ? JSON.parse(rawPrefab) : undefined; } catch(e) {}
      onDrop(compName, node.id, position, pData);
    }
  };

  return (
    <div
      className={`blueprint-island ${isSelected ? 'selected' : ''} ${node.component === 'Prefab' ? 'is-prefab' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onClick={(e) => { 
        e.preventDefault();
        e.stopPropagation(); 
        onEdit(node.id); 
      }}
    >
      <div
        className={`drop-zone-edge ${isOverTop ? 'active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsOverTop(true); }}
        onDragLeave={() => setIsOverTop(false)}
        onDrop={(e) => handleUniversalDrop(e, 'before')}
      />

      <div className="island-header">
        <span className="type-badge">
          <i className={`fas ${node.component === 'Prefab' ? 'fa-clone' : 'fa-grip-vertical'} drag-handle`} /> {node.component}
        </span>
        <button
          type="button"
          className="delete-trigger"
          onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
        >
          <i className="fas fa-trash-alt" />
        </button>
      </div>

      <div className="island-body">
        {node.children.map(child => (
          <BlueprintNode
            key={child.id}
            node={child}
            onDrop={onDrop}
            onMove={onMove}
            onEdit={onEdit}
            onDelete={onDelete}
            isSelected={isSelected}
          />
        ))}
        <div
          className={`drop-zone-mini ${isOverInside ? 'active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsOverInside(true); }}
          onDragLeave={() => setIsOverInside(false)}
          onDrop={(e) => handleUniversalDrop(e, 'inside')}
        >
          <i className="fas fa-plus" />
        </div>
      </div>
    </div>
  );
};