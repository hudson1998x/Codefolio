import React, { useState, useMemo, useEffect, createElement, Fragment, ReactNode, useCallback } from "react";
import { registerComponent, CodefolioProps, getAllComponents, getComponent, FieldMeta } from "../registry";
import { Button } from "@components/button";
import './style.scss';
import { Canvas } from "./canvas";
import { CanvasNode, NodeId, Prefab } from "./types";
import { PropField } from "./propfield";
import { BlueprintNode } from "./blueprint-node";

// --- Main Visual Editor ---

export const CanvasEditor: React.FC<CodefolioProps<{ value: string; name: string }> & { 
  onChange?: (val: string) => void 
}> = ({ data, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [nodes, setNodes] = useState<CanvasNode[]>(() => {
    try { return data.value ? JSON.parse(data.value) : []; } catch { return []; }
  });
  const [selectedId, setSelectedId] = useState<NodeId | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [prefabs, setPrefabs] = useState<Prefab[]>([]);

  const getSerializedNodes = useCallback(() => JSON.stringify(nodes), [nodes]);

  useEffect(() => {
    if (onChange) {
      const serialized = getSerializedNodes();
      if (serialized !== data.value) {
        onChange(serialized);
      }
    }
  }, [nodes, onChange, data.value, getSerializedNodes]);

  const handleFinish = () => {
    if (onChange) {
      onChange(getSerializedNodes());
    }
    setIsOpen(false);
  };

  const cmsComponents = useMemo(() => {
    return getAllComponents().filter((c: any) => c.isCmsEditor === true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/prefab?size=50')
        .then(res => res.json())
        .then(res => { if (res.ok) setPrefabs(res.results); })
        .catch(err => console.error("Prefab fetch error", err));
    }
  }, [isOpen]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    cmsComponents.forEach((c: any) => cats.add(c.category || "Uncategorized"));
    return ["All", ...Array.from(cats).sort()];
  }, [cmsComponents]);

  const filteredLibrary = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q) return cmsComponents.filter(c => c.name.toLowerCase().includes(q));
    if (activeCategory === "All") return cmsComponents;
    return cmsComponents.filter(c => (c.category || "Uncategorized") === activeCategory);
  }, [activeCategory, cmsComponents, search]);

  const activeNode = useMemo(() => {
    if (!selectedId) return null;
    const find = (list: CanvasNode[]): CanvasNode | undefined => {
      for (const n of list) {
        if (n.id === selectedId) return n;
        const found = find(n.children);
        if (found) return found;
      }
    };
    return find(nodes) || null;
  }, [nodes, selectedId]);

  const activeDef = useMemo(() => activeNode ? getComponent(activeNode.component) : null, [activeNode]);

  const updateNodeData = useCallback((key: string, val: any) => {
    if (!selectedId) return;
    setNodes(currentNodes => {
      const newTree: CanvasNode[] = structuredClone(currentNodes);
      const map = (list: CanvasNode[]): CanvasNode[] => list.map(n => {
        if (n.id === selectedId) {
          let processed = val;
          if (key === 'prefabJson' && typeof val === 'string') {
            try { 
              const parsed = JSON.parse(val); 
              processed = Array.isArray(parsed) ? parsed : [parsed];
            } catch { processed = val; }
          }
          return { ...n, data: { ...n.data, [key]: processed } };
        }
        return { ...n, children: map(n.children) };
      });
      return map(newTree);
    });
  }, [selectedId]);

const addNode = (name: string, targetId?: NodeId, position: 'before' | 'inside' = 'inside', prefabData?: any) => {
  const def = getComponent(name);
  
  let finalData = {};

  if (name === "Prefab" && prefabData) {
    // This data is already a fresh copy because it was parsed from the DragEvent string
    finalData = {
      prefabName: prefabData.prefabName || '',
      prefabJson: prefabData.prefabJson || []
    };
  } else {
    // For regular components, keep your existing structuredClone
    finalData = def?.defaults ? structuredClone(def.defaults) : {};
  }

  const newNode: CanvasNode = {
    id: crypto.randomUUID(),
    component: name,
    data: finalData,
    children: [],
  };

    setNodes(prev => {
      const treeClone = structuredClone(prev);
      if (!targetId) return [...treeClone, newNode];
      
      const insert = (list: CanvasNode[]): CanvasNode[] => {
        return list.map(n => {
          if (n.id === targetId) {
            if (position === 'inside') {
              return { ...n, children: [...n.children, newNode] };
            }
          }
          return { ...n, children: insert(n.children) };
        });
        // Handle 'before' logic here if needed, omitted for brevity
      };
      
      // Simple push if no specific target logic hit
      if (position === 'before') {
          const idx = treeClone.findIndex(n => n.id === targetId);
          if (idx > -1) {
              treeClone.splice(idx, 0, newNode);
              return treeClone;
          }
      }

      return insert(treeClone);
    });
    setSelectedId(newNode.id);
  };

  const moveNode = (dragId: NodeId, targetId?: NodeId, position: 'before' | 'inside' = 'inside') => {
    if (dragId === targetId) return;
    setNodes(prev => {
      const treeClone = structuredClone(prev);
      let nodeToMove: CanvasNode | null = null;
      const pull = (list: CanvasNode[]): CanvasNode[] => list.reduce((acc, n) => {
        if (n.id === dragId) { nodeToMove = n; return acc; }
        acc.push({ ...n, children: pull(n.children) });
        return acc;
      }, [] as CanvasNode[]);

      const treeWithoutNode = pull(treeClone);
      if (!nodeToMove) return prev;
      if (!targetId) return [...treeWithoutNode, nodeToMove];

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
      return push(treeWithoutNode);
    });
  };

  const deleteNode = (id: NodeId) => {
    setNodes(prev => {
      const remove = (list: CanvasNode[]): CanvasNode[] =>
        list.filter(n => n.id !== id).map(n => ({ ...n, children: remove(n.children) }));
      return remove(structuredClone(prev));
    });
    if (selectedId === id) setSelectedId(null);
  };

  const handleWorkspaceDrop = (e: React.DragEvent) => {
    const name = e.dataTransfer.getData("componentName");
    const dragId = e.dataTransfer.getData("dragNodeId");
    const rawPrefab = e.dataTransfer.getData("prefabData");
    if (dragId) moveNode(dragId);
    else if (name) {
      let pData = undefined;
      try { pData = rawPrefab ? JSON.parse(rawPrefab) : undefined; } catch(e) {}
      addNode(name, undefined, 'inside', pData);
    }
  };

  return (
    <div className="canvas-editor">
      <input type="hidden" name={data.name} value={getSerializedNodes()} />
      <span className="editor-label">
        
        {
        // @ts-ignore TODO: Alter type definition to allow optional label. 
        data?.label ?? ''}
      </span>
      <br />
      <Button type="button" onClick={() => setIsOpen(true)}>Visual Editor</Button>

      {isOpen && (
        <div className="editor-overlay">
          <aside className="panel-island side-nav">
            <div className="section-title"><i className="fas fa-th-large" /> Library</div>
            <div className="library-search">
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {!search && (
              <div className="category-capsules">
                {categories.map(cat => (
                  <button key={cat} className={`capsule ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
            <div className="palette-grid" style={{ height: 300, overflowX: 'hidden' }}>
              {filteredLibrary.map(c => (
                <div key={c.name} className="palette-item" draggable onDragStart={(e) => {
                   e.dataTransfer.setData("componentName", c.name);
                }}>
                  <i className={(c as any).icon || "fas fa-cube"} />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
            <div className="section-title" style={{marginTop: '2rem'}}><i className="fas fa-layer-group" /> Prefabs</div>
            <div className="palette-grid">
              {prefabs.map(p => (
                // Inside your prefabs.map in the sidebar
                <div 
                  key={p.id} 
                  className="palette-item prefab-item" 
                  draggable 
                  onDragStart={(e) => {
                    // PASS ONLY THE SERIALIZED STRING
                    // This makes it impossible for the Canvas to "reach back" to the Sidebar
                    e.dataTransfer.setData("componentName", "Prefab");
                    e.dataTransfer.setData("prefabData", JSON.stringify({
                      prefabName: p.prefabName,
                      prefabJson: p.prefabJson // This gets flattened to a string here
                    }));
                  }}
                >
                  <i className="fas fa-clone" />
                  <span>{p.prefabName}</span>
                </div>
              ))}
            </div>
          </aside>

          <main className="workspace-container" onClick={() => setSelectedId(null)}>
            <section className="workspace-pane blueprint" onDragOver={e => e.preventDefault()} onDrop={handleWorkspaceDrop}>
              <div className="pane-label">Structure</div>
              <div className="tree-content">
                {nodes.map(n => (
                  <BlueprintNode 
                    key={n.id} 
                    node={n} 
                    onDrop={addNode} 
                    onMove={moveNode} 
                    onEdit={(id) => setSelectedId(id)} 
                    onDelete={deleteNode} 
                    isSelected={selectedId === n.id} 
                  />
                ))}
              </div>
            </section>

            <section className="workspace-pane properties-pane" onClick={(e) => e.stopPropagation()}>
              <div className="pane-label">Properties</div>
              <div className="settings-content">
                {activeNode && (activeDef || activeNode.component === "Prefab") ? (
                  <div className="prop-controls">
                    <div className="editing-badge">{activeNode.component}</div>
                    {Object.keys(activeDef?.fields || activeDef?.defaults || {}).map(key => (
                      <PropField
                        key={key}
                        propKey={key}
                        value={activeNode.data[key]}
                        meta={activeDef?.fields?.[key]}
                        onChange={val => updateNodeData(key, val)}
                      />
                    ))}
                  </div>
                ) : <div className="empty-hint">Select a block to edit</div>}
              </div>
            </section>

            <section className="workspace-pane preview">
              <div className="pane-label">Live Preview</div>
              <div className="preview-frame">
                <div className="canvas-wrapper">
                  <Canvas manualNodes={nodes} key={getSerializedNodes().length} />
                </div>
                <button className="close-visual" onClick={handleFinish}>FINISH & SYNC</button>
              </div>
            </section>
          </main>
        </div>
      )}
    </div>
  );
};

registerComponent({
  name: "CanvasEditor",
  defaults: { value: "", name: "" },
  component: CanvasEditor,
});