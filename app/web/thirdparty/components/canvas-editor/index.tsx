import React, { useState, useMemo, useEffect, useCallback, useReducer } from "react";
import { registerComponent, CodefolioProps, getAllComponents, getComponent, FieldMeta } from "../registry";
import { Button } from "@components/button";
import './style.scss';
import { Canvas } from "./canvas";
import { CanvasNode, NodeId, Prefab } from "./types";
import { PropField } from "./propfield";
import { BlueprintNode } from "./blueprint-node";
import { DragState } from "./drag-state";

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
  const [, forceRender] = useReducer(x => x + 1, 0);

  const getSerializedNodes = useCallback(() => JSON.stringify(nodes), [nodes]);

  useEffect(() => {
    if (onChange) {
      const serialized = getSerializedNodes();
      if (serialized !== data.value) onChange(serialized);
    }
  }, [nodes, onChange, data.value, getSerializedNodes]);

  const handleFinish = () => {
    if (onChange) onChange(getSerializedNodes());
    setIsOpen(false);
  };

  const cmsComponents = useMemo(() =>
    getAllComponents().filter((c: any) => c.isCmsEditor === true),
  []);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/prefab?size=50')
      .then(res => res.json())
      .then(res => { if (res.ok) setPrefabs(res.results); })
      .catch(err => console.error("Prefab fetch error", err));
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
    return find(nodes) ?? null;
  }, [nodes, selectedId]);

  const activeDef = useMemo(() =>
    activeNode ? getComponent(activeNode.component) : null,
  [activeNode]);

  const updateNodeData = useCallback((key: string, val: any) => {
    if (!selectedId) return;
    setNodes(curr => {
      const map = (list: CanvasNode[]): CanvasNode[] => {
        let changed = false;
        const next = list.map(n => {
          if (n.id === selectedId) {
            changed = true;
            let processed = val;
            if (key === 'prefabJson' && typeof val === 'string') {
              try {
                const parsed = JSON.parse(val);
                processed = structuredClone(Array.isArray(parsed) ? parsed : [parsed]);
              } catch { processed = val; }
            } else {
              try { processed = structuredClone(val); } catch { processed = val; }
            }
            return { ...n, data: { ...n.data, [key]: processed } };
          }
          const newChildren = map(n.children);
          if (newChildren !== n.children) { changed = true; return { ...n, children: newChildren }; }
          return n;
        });
        return changed ? next : list;
      };
      return map(curr);
    });
  }, [selectedId]);

  const addNode = useCallback((name: string, targetId?: NodeId, position: 'before' | 'inside' = 'inside', prefabData?: any) => {
    const def = getComponent(name);
    const finalData = name === "Prefab" && prefabData
      ? { prefabName: prefabData.prefabName || '', prefabJson: structuredClone(prefabData.prefabJson || []) }
      : def?.defaults ? structuredClone(def.defaults) : {};

    const newNode: CanvasNode = { id: crypto.randomUUID(), component: name, data: finalData, children: [] };

    setNodes(prev => {
      if (!targetId) return [...prev, newNode];
      const insert = (list: CanvasNode[]): CanvasNode[] => {
        const result: CanvasNode[] = [];
        for (const n of list) {
          if (n.id === targetId) {
            if (position === 'before') result.push(newNode);
            result.push({
              ...n,
              children: position === 'inside' ? [...n.children, newNode] : insert(n.children)
            });
          } else {
            result.push({ ...n, children: insert(n.children) });
          }
        }
        return result;
      };
      return insert(prev);
    });
    setSelectedId(newNode.id);
    forceRender();
  }, []);

  const moveNode = useCallback((dragId: NodeId, targetId?: NodeId, position: 'before' | 'inside' = 'inside') => {
    if (dragId === targetId) return;
    setNodes(prev => {
      let nodeToMove: CanvasNode | null = null;
      const pull = (list: CanvasNode[]): CanvasNode[] =>
        list.reduce<CanvasNode[]>((acc, n) => {
          if (n.id === dragId) { nodeToMove = n; return acc; }
          acc.push({ ...n, children: pull(n.children) });
          return acc;
        }, []);

      const trimmed = pull(prev);
      if (!nodeToMove) return prev;
      if (!targetId) return [...trimmed, nodeToMove];

      const push = (list: CanvasNode[]): CanvasNode[] => {
        const result: CanvasNode[] = [];
        for (const n of list) {
          if (n.id === targetId) {
            if (position === 'before') result.push(nodeToMove!);
            result.push({
              ...n,
              children: position === 'inside' ? [...n.children, nodeToMove!] : push(n.children)
            });
          } else {
            result.push({ ...n, children: push(n.children) });
          }
        }
        return result;
      };
      return push(trimmed);
    });
    forceRender();
  }, []);

  const deleteNode = useCallback((id: NodeId) => {
    setNodes(prev => {
      const remove = (list: CanvasNode[]): CanvasNode[] =>
        list.filter(n => n.id !== id).map(n => ({ ...n, children: remove(n.children) }));
      return remove(prev);
    });
    setSelectedId(s => s === id ? null : s);
    forceRender();
  }, []);

  const handleEdit = useCallback((id: NodeId) => setSelectedId(id), []);

  const handleBlueprintDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const payload = DragState.get();
    DragState.clear();
    if (!payload) return;
    if (payload.type === 'node') {
      moveNode(payload.dragId, undefined, 'inside');
    } else {
      addNode(payload.name, undefined, 'inside', payload.prefabData);
    }
  }, [addNode, moveNode]);

  const serialized = getSerializedNodes();

  return (
    <div className="canvas-editor">
      <input type="hidden" name={data.name} value={serialized} />
      <span className="editor-label">
        {/* @ts-ignore TODO: Alter type definition to allow optional label. */}
        {data?.label ?? ''}
      </span>
      <br />
      <Button type="button" onClick={() => setIsOpen(true)}>
        <i className='fas fa-pager' /> Visual Editor <i className='fas fa-pencil' />
      </Button>

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
                <div
                  key={c.name}
                  className="palette-item"
                  draggable
                  onDragStart={(e) => {
                    DragState.set({ type: 'component', name: c.name });
                    e.dataTransfer.setData("text/plain", "drag");
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onDragEnd={() => DragState.clear()}
                >
                  <i className={(c as any).icon || "fas fa-cube"} />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>

            <div className="section-title" style={{ marginTop: '2rem' }}><i className="fas fa-layer-group" /> Prefabs</div>
            <div className="palette-grid">
              {prefabs.map(p => (
                <div
                  key={p.id}
                  className="palette-item prefab-item"
                  draggable
                  onDragStart={(e) => {
                    DragState.set({
                      type: 'component',
                      name: 'Prefab',
                      prefabData: { prefabName: p.prefabName, prefabJson: p.prefabJson }
                    });
                    e.dataTransfer.setData("text/plain", "drag");
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onDragEnd={() => DragState.clear()}
                >
                  <i className="fas fa-clone" />
                  <span>{p.prefabName}</span>
                </div>
              ))}
            </div>
          </aside>

          <main className="workspace-container" onClick={() => setSelectedId(null)}>
            <section
              className="workspace-pane blueprint"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleBlueprintDrop}
            >
              <div className="pane-label">Structure</div>
              <div className="tree-content">
                {nodes.map(n => (
                  <BlueprintNode
                    key={n.id}
                    node={n}
                    onDrop={addNode}
                    onMove={moveNode}
                    onEdit={handleEdit}
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
                        key={`${selectedId}-${key}`}
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
                  <Canvas manualNodes={nodes} key={serialized} />
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