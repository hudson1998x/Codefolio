import { useRef, useEffect, memo } from "react";
import { CanvasNode, NodeId } from "./types";
import { DragState } from "./drag-state";

const BlueprintNodeInner: React.FC<{
  node: CanvasNode;
  onDrop: (compName: string, targetId?: NodeId, position?: 'before' | 'inside', prefabData?: any) => void;
  onMove: (dragId: NodeId, targetId?: NodeId, position?: 'before' | 'inside') => void;
  onEdit: (id: NodeId) => void;
  onDelete: (id: NodeId) => void;
  isSelected: boolean;
}> = ({ node, onDrop, onMove, onEdit, onDelete, isSelected }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const edgeRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const cbRef = useRef({ onDrop, onMove, onEdit, onDelete });
  useEffect(() => { cbRef.current = { onDrop, onMove, onEdit, onDelete }; });

  useEffect(() => {
    const card = cardRef.current;
    const edge = edgeRef.current;
    const mini = miniRef.current;
    const header = headerRef.current;
    const deleteBtn = deleteRef.current;
    if (!card || !edge || !mini || !header || !deleteBtn) return;

    const nodeId = node.id;

    const onDragStart = (e: DragEvent) => {
      e.stopPropagation();
      // Store in module state — not dataTransfer
      DragState.set({ type: 'node', dragId: nodeId });
      // dataTransfer still needs *something* set or browser won't allow the drop
      e.dataTransfer?.setData("text/plain", "drag");
      e.dataTransfer?.setDragImage(card, 10, 10);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    };

    const onDragEnd = () => DragState.clear();

    const handleDrop = (e: DragEvent, position: 'before' | 'inside') => {
      e.preventDefault();
      e.stopPropagation();
      edge.classList.remove('active');
      mini.classList.remove('active');
      const payload = DragState.get();
      DragState.clear();
      if (!payload) return;
      if (payload.type === 'node') {
        cbRef.current.onMove(payload.dragId, nodeId, position);
      } else {
        cbRef.current.onDrop(payload.name, nodeId, position, payload.prefabData);
      }
    };

    const onEdgeDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); edge.classList.add('active'); };
    const onEdgeDragLeave = () => edge.classList.remove('active');
    const onEdgeDrop = (e: DragEvent) => handleDrop(e, 'before');

    const onMiniDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); mini.classList.add('active'); };
    const onMiniDragLeave = () => mini.classList.remove('active');
    const onMiniDrop = (e: DragEvent) => handleDrop(e, 'inside');

    const onCardClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      cbRef.current.onEdit(nodeId);
    };

    const onDeleteClick = (e: MouseEvent) => {
      e.stopPropagation();
      cbRef.current.onDelete(nodeId);
    };

    header.draggable = true;
    header.addEventListener('dragstart', onDragStart);
    header.addEventListener('dragend', onDragEnd);
    edge.addEventListener('dragover', onEdgeDragOver);
    edge.addEventListener('dragleave', onEdgeDragLeave);
    edge.addEventListener('drop', onEdgeDrop);
    mini.addEventListener('dragover', onMiniDragOver);
    mini.addEventListener('dragleave', onMiniDragLeave);
    mini.addEventListener('drop', onMiniDrop);
    card.addEventListener('click', onCardClick);
    deleteBtn.addEventListener('click', onDeleteClick);

    return () => {
      header.removeEventListener('dragstart', onDragStart);
      header.removeEventListener('dragend', onDragEnd);
      edge.removeEventListener('dragover', onEdgeDragOver);
      edge.removeEventListener('dragleave', onEdgeDragLeave);
      edge.removeEventListener('drop', onEdgeDrop);
      mini.removeEventListener('dragover', onMiniDragOver);
      mini.removeEventListener('dragleave', onMiniDragLeave);
      mini.removeEventListener('drop', onMiniDrop);
      card.removeEventListener('click', onCardClick);
      deleteBtn.removeEventListener('click', onDeleteClick);
    };
  }, [node.id]);

  return (
    <div
      ref={cardRef}
      className={`blueprint-island ${isSelected ? 'selected' : ''} ${node.component === 'Prefab' ? 'is-prefab' : ''}`}
    >
      <div ref={edgeRef} className="drop-zone-edge" />
      <div ref={headerRef} className="island-header">
        <span className="type-badge">
          <i className={`fas ${node.component === 'Prefab' ? 'fa-clone' : 'fa-grip-vertical'} drag-handle`} />
          {node.component}
          {node.component === 'Text' && (
            <span className="type-badge-preview">
              {node.data.content?.trim()
                ? node.data.content.length > 15
                  ? `'${node.data.content.substring(0, 15)}…'`
                  : `'${node.data.content}'`
                : <em>empty</em>
              }
            </span>
          )}
        </span>
        <button
          ref={deleteRef}
          type="button"
          className="delete-trigger"
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
        <div ref={miniRef} className="drop-zone-mini">
          <i className="fas fa-plus" />
        </div>
      </div>
    </div>
  );
};

export const BlueprintNode = memo(BlueprintNodeInner, (prev, next) => {
  return (
    prev.isSelected === next.isSelected &&
    prev.node.id === next.node.id &&
    prev.node.component === next.node.component &&
    prev.node.data === next.node.data &&
    prev.node.children === next.node.children
  );
});