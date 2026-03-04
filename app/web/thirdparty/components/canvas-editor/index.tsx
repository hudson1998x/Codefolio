import React, { useState, useMemo, useCallback, useRef, useEffect, createElement, Fragment, ReactNode } from "react";
import { registerComponent, CodefolioProps, getAllComponents, getComponent } from "../registry";
import { Button } from "@components/button";
import './style.scss';

// --- Types ---
export type NodeId = string;
export interface CanvasNode {
  id: NodeId;
  component: string;
  data: Record<string, any>;
  children: CanvasNode[];
}

// --- Internal Canvas Renderer ---
const renderNode = (node: CanvasNode): ReactNode => {
  if (!node) return null;
  const { component: type, data = {}, children = [], id } = node;
  const registered = getComponent(type);

  const renderedChildren = children.map((child) => (
    <Fragment key={child.id}>{renderNode(child)}</Fragment>
  ));

  if (registered) {
    return createElement(
      registered.component,
      { data, key: id },
      renderedChildren.length ? renderedChildren : undefined
    );
  }

  // Fallback for raw HTML or text blocks
  const { textContent, ...restProps } = data;
  return createElement(
    "div",
    { ...restProps, key: id },
    renderedChildren.length ? renderedChildren : textContent || null
  );
};

export const Canvas: React.FC<{ manualNodes?: CanvasNode[] }> = ({ manualNodes }) => {
  if (manualNodes && manualNodes.length > 0) {
    return <>{manualNodes.map(node => renderNode(node))}</>;
  }
  return <div className="canvas-placeholder">Drag components here to start building.</div>;
};

// --- Tree Node (Blueprint Island) ---
const BlueprintNode: React.FC<{ 
    node: CanvasNode; 
    onDrop: (compName: string, targetId?: NodeId, position?: 'before' | 'inside') => void;
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

    if (dragId) onMove(dragId, node.id, position);
    else if (compName) onDrop(compName, node.id, position);
  };

  return (
    <div 
      className={`blueprint-island ${isSelected ? 'selected' : ''}`} 
      draggable 
      onDragStart={handleDragStart}
      onClick={(e) => { e.stopPropagation(); onEdit(node.id); }}
    >
      {/* Target for "Insert Before" */}
      <div 
        className={`drop-zone-edge ${isOverTop ? 'active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsOverTop(true); }}
        onDragLeave={() => setIsOverTop(false)}
        onDrop={(e) => handleUniversalDrop(e, 'before')}
      />

      <div className="island-header">
        <span className="type-badge">
          <i className="fas fa-grip-vertical drag-handle" /> {node.component}
        </span>
        <button type='button' className="delete-trigger" onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}>
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
        {/* Target for "Insert Inside" */}
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

// --- Main Visual Editor ---
const CanvasEditor: React.FC<CodefolioProps<{value: string, name: string}>> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [nodes, setNodes] = useState<CanvasNode[]>(() => {
    try { return data.value ? JSON.parse(data.value) : []; } catch { return []; }
  });
  const [selectedId, setSelectedId] = useState<NodeId | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  // --- Filtered Library Logic ---
  const cmsComponents = useMemo(() => {
    // Only show components where isCmsEditor is explicitly true
    return getAllComponents().filter((c: any) => {
        return c.isCmsEditor === true
    });
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>(["All"]);
    cmsComponents.forEach((c: any) => {
      cats.add(c.category || "Uncategorized");
    });
    return Array.from(cats).sort((a, b) => {
        if (a === "All") return -1;
        if (a === "Uncategorized") return 1;
        return a.localeCompare(b);
    });
  }, [cmsComponents]);

  const filteredLibrary = useMemo(() => {
    if (activeCategory === "All") return cmsComponents;
    return cmsComponents.filter((c: any) => (c.category || "Uncategorized") === activeCategory);
  }, [activeCategory, cmsComponents]);

  const activeNode = useMemo(() => {
    const find = (list: CanvasNode[]): CanvasNode | undefined => {
      for (const n of list) {
        if (n.id === selectedId) return n;
        const found = find(n.children);
        if (found) return found;
      }
    };
    return selectedId ? find(nodes) : null;
  }, [nodes, selectedId]);

  const activeDef = useMemo(() => activeNode ? getComponent(activeNode.component) : null, [activeNode]);

  // --- Node Operations ---
  const deleteNode = (id: NodeId) => {
    const remove = (list: CanvasNode[]): CanvasNode[] => 
      list.filter(n => n.id !== id).map(n => ({ ...n, children: remove(n.children) }));
    setNodes(prev => remove(prev));
    if (selectedId === id) setSelectedId(null);
  };

  const addNode = (name: string, targetId?: NodeId, position: 'before' | 'inside' = 'inside') => {
    const def = getComponent(name);
    if (!def) return;
    const newNode: CanvasNode = { id: crypto.randomUUID(), component: name, data: { ...def.defaults }, children: [] };
    
    if (!targetId) {
        setNodes(prev => [...prev, newNode]);
        setSelectedId(newNode.id);
        return;
    }

    const insert = (list: CanvasNode[]): CanvasNode[] => {
      let result: CanvasNode[] = [];
      for (const n of list) {
        if (n.id === targetId) {
          if (position === 'before') result.push(newNode);
          if (position === 'inside') {
            result.push({ ...n, children: [...n.children, newNode] });
            continue;
          }
        }
        result.push({ ...n, children: insert(n.children) });
      }
      return result;
    };
    setNodes(prev => insert(prev));
    setSelectedId(newNode.id);
  };

  const moveNode = (dragId: NodeId, targetId?: NodeId, position: 'before' | 'inside' = 'inside') => {
    if (dragId === targetId) return;
    let nodeToMove: CanvasNode | null = null;

    const pull = (list: CanvasNode[]): CanvasNode[] => {
      return list.reduce((acc, n) => {
        if (n.id === dragId) { nodeToMove = n; return acc; }
        acc.push({ ...n, children: pull(n.children) });
        return acc;
      }, [] as CanvasNode[]);
    };

    const treeWithoutNode = pull(nodes);
    if (!nodeToMove) return;

    if (!targetId) {
        setNodes([...treeWithoutNode, nodeToMove]);
        return;
    }

    const push = (list: CanvasNode[]): CanvasNode[] => {
      let result: CanvasNode[] = [];
      for (const n of list) {
        if (n.id === targetId) {
          if (position === 'before') result.push(nodeToMove!);
          if (position === 'inside') {
            result.push({ ...n, children: [...n.children, nodeToMove!] });
            continue;
          }
        }
        result.push({ ...n, children: push(n.children) });
      }
      return result;
    };
    setNodes(push(treeWithoutNode));
  };

  return (
    <div className='canvas-editor'>
      <input type='hidden' name={data.name} value={JSON.stringify(nodes)}/>
      <Button type='button' onClick={() => setIsOpen(true)}>Visual Editor</Button>

      {isOpen && (
        <div className='editor-overlay'>
          {/* Library Sidebar */}
          <aside className='panel-island side-nav'>
             <div className="section-title"><i className="fas fa-th-large" /> Library</div>
             <div className="category-capsules">
                {categories.map(cat => (
                  <button 
                    type='button'
                    key={cat} 
                    className={`capsule ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
             </div>
             <div className="palette-grid">
                {filteredLibrary.map(c => (
                  <div 
                    key={c.name} 
                    className="palette-item" 
                    draggable 
                    onDragStart={(e) => e.dataTransfer.setData("componentName", c.name)}
                  >
                    <i className={(c as any).icon || "fas fa-cube"} />
                    <span>{c.name}</span>
                  </div>
                ))}
             </div>
          </aside>

          <main className='workspace-container'>
            {/* 1. STRUCTURE PANE */}
            <section 
                className='workspace-pane blueprint' 
                onDragOver={e => e.preventDefault()} 
                onDrop={e => {
                    const name = e.dataTransfer.getData("componentName");
                    const dragId = e.dataTransfer.getData("dragNodeId");
                    if (dragId) moveNode(dragId);
                    else if (name) addNode(name);
                }}
            >
               <div className="pane-label">Structure</div>
               <div className="tree-content">
                  {nodes.map(n => (
                    <BlueprintNode 
                        key={n.id} 
                        node={n} 
                        onDrop={addNode} 
                        onMove={moveNode} 
                        onEdit={setSelectedId} 
                        onDelete={deleteNode} 
                        isSelected={selectedId === n.id} 
                    />
                  ))}
                  <div className="root-drop-indicator">Drop to Root</div>
               </div>
            </section>

            {/* 2. PROPERTIES PANE */}
            <section className='workspace-pane properties-pane'>
               <div className="pane-label">Properties</div>
               <div className="settings-content">
                  {activeNode && activeDef ? (
                    <div className="prop-controls">
                        <div className="editing-badge">{activeNode.component}</div>
                        {Object.keys(activeDef.defaults).map(key => (
                            <div key={key} className="field-group">
                                <label>{key}</label>
                                <input 
                                  type="text" 
                                  value={activeNode.data[key] || ""} 
                                  onChange={e => {
                                    const val = e.target.value;
                                    setNodes(prev => {
                                      const map = (list: CanvasNode[]): CanvasNode[] => list.map(n => 
                                        n.id === selectedId ? { ...n, data: { ...n.data, [key]: val } } : { ...n, children: map(n.children) }
                                      );
                                      return map(prev);
                                    });
                                  }} 
                                />
                            </div>
                        ))}
                    </div>
                  ) : <div className="empty-hint">Select a block to edit properties</div>}
               </div>
            </section>

            {/* 3. PREVIEW PANE */}
            <section className='workspace-pane preview'>
               <div className="pane-label">Live Preview</div>
               <div className="preview-frame">
                  <div className="canvas-wrapper">
                    <Canvas manualNodes={nodes} />
                  </div>
                  <button type='button' className="close-visual" onClick={() => setIsOpen(false)}>Finish</button>
               </div>
            </section>
          </main>
        </div>
      )}
    </div>
  );
};

// --- RESTORED REGISTRATION ---
registerComponent({
  name: "CanvasEditor",
  defaults: { value: "", name: "" },
  component: CanvasEditor,
});