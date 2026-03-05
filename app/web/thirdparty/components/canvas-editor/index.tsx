import React, { useState, useMemo, createElement, Fragment, ReactNode } from "react";
import { registerComponent, CodefolioProps, getAllComponents, getComponent, FieldMeta } from "../registry";
import { Button } from "@components/button";
import './style.scss';

// --- Types ---

/** Unique identifier for a canvas node. */
export type NodeId = string;

/**
 * Represents a single node in the Codefolio content tree.
 *
 * @remarks
 * This is the core data structure that drives both the visual editor
 * and the page renderer. Each node maps to a registered component by name,
 * carries its authored `data` payload, and may contain nested child nodes.
 */
export interface CanvasNode {
  /** Unique identifier for this node, used for selection, drag/drop and keying. */
  id: NodeId;
  /** The registered component name to mount for this node. */
  component: string;
  /** The authored data payload for this node — must satisfy the component's defaults shape. */
  data: Record<string, any>;
  /** Nested child nodes, rendered as children of this component. */
  children: CanvasNode[];
}

// --- Internal Canvas Renderer ---

/**
 * Recursively renders a {@link CanvasNode} tree into React elements.
 *
 * @remarks
 * Looks up each node's component name in the registry. If found, mounts
 * the registered React component with `data` and rendered children.
 * Falls back to a plain `<div>` for unknown component names.
 *
 * @param node - The canvas node to render.
 * @returns A React node representing the full subtree.
 */
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

  const { textContent, ...restProps } = data;
  return createElement(
    "div",
    { ...restProps, key: id },
    renderedChildren.length ? renderedChildren : textContent || null
  );
};

/**
 * Renders a flat list of {@link CanvasNode}s into the page.
 *
 * @remarks
 * Used both inside the visual editor preview pane and on the public-facing
 * page to hydrate saved content JSON into live React components.
 *
 * @param manualNodes - Optional array of nodes to render. If empty or
 *                      omitted, renders a placeholder prompt.
 */
export const Canvas: React.FC<{ manualNodes?: CanvasNode[] }> = ({ manualNodes }) => {
  if (manualNodes && manualNodes.length > 0) {
    return <>{manualNodes.map(node => renderNode(node))}</>;
  }
  return <div className="canvas-placeholder">Drag components here to start building.</div>;
};

// --- Properties Pane Field Renderer ---

/**
 * Renders a single editable field in the properties pane.
 *
 * @remarks
 * Consults the field's {@link FieldMeta} to decide which input control
 * to render. Falls back to a plain text input when no metadata is provided.
 * Supported control types:
 * - `text` — single-line text input (default)
 * - `textarea` — multi-line text input, 6 rows
 * - `select` — dropdown populated from `meta.options`
 * - `boolean` — animated toggle button, stores `"true"` / `"false"` as strings
 *
 * @param propKey - The data key this field edits.
 * @param value - The current value of the field.
 * @param meta - Optional {@link FieldMeta} describing the control type.
 * @param onChange - Callback invoked with the new string value on change.
 */
/**
 * Renders a single editable field in the properties pane.
 *
 * @remarks
 * Consults the field's {@link FieldMeta} to decide which input control
 * to render. Falls back to a plain text input when no metadata is provided.
 * Supported control types:
 * - `text` — single-line text input (default)
 * - `textarea` — multi-line text input
 * - `select` — dropdown populated from `meta.options`
 * - `boolean` — animated toggle button, stores `"true"` / `"false"` as strings
 * - `json` — syntax-aware textarea with live JSON validation indicator
 *
 * @param propKey - The data key this field edits.
 * @param value - The current value of the field.
 * @param meta - Optional {@link FieldMeta} describing the control type.
 * @param onChange - Callback invoked with the new string value on change.
 */
const PropField: React.FC<{
  propKey: string;
  value: any;
  meta?: FieldMeta;
  onChange: (val: string) => void;
}> = ({ propKey, value, meta, onChange }) => {
  const label = meta?.label || propKey.replace(/([A-Z])/g, ' $1').trim();
  const type = meta?.type || 'text';
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (val: string) => {
    onChange(val);
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  return (
    <div className="field-group">
      <label>{label}</label>
      {type === 'select' && meta?.options ? (
        <select value={value || ""} onChange={e => onChange(e.target.value)}>
          {meta.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          rows={6}
        />
      ) : type === 'json' ? (
        <div className="json-field">
          <textarea
            className={`json-field__textarea ${jsonError ? 'has-error' : 'is-valid'}`}
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={e => handleJsonChange(e.target.value)}
            rows={10}
            spellCheck={false}
          />
          {jsonError ? (
            <div className="json-field__status json-field__status--error">
              <i className="fas fa-times-circle" /> {jsonError}
            </div>
          ) : (
            <div className="json-field__status json-field__status--valid">
              <i className="fas fa-check-circle" /> Valid JSON
            </div>
          )}
        </div>
      ) : type === 'boolean' ? (
        <div className="toggle-wrap">
          <button
            type="button"
            className={`toggle ${value === 'true' ? 'active' : ''}`}
            onClick={() => onChange(value === 'true' ? 'false' : 'true')}
          >
            <span className="toggle-thumb" />
          </button>
          <span className="toggle-label">{value === 'true' ? 'On' : 'Off'}</span>
        </div>
      ) : (
        <input
          type="text"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  );
};

// --- Tree Node (Blueprint Island) ---

/**
 * Renders a single node in the Structure pane as a draggable "island".
 *
 * @remarks
 * Each island displays the component name, a drag handle, a delete button,
 * and recursively renders its children as nested islands. Supports two
 * drop targets:
 * - **Edge zone** (top) — inserts a dropped component/node before this one
 * - **Mini zone** (inside body) — inserts a dropped component/node as a child
 *
 * Both new-component drops (via `componentName` dataTransfer) and
 * node-move drops (via `dragNodeId` dataTransfer) are handled uniformly.
 */
const BlueprintNode: React.FC<{
  /** The canvas node this island represents. */
  node: CanvasNode;
  /** Called when a new component is dropped onto this node's drop zones. */
  onDrop: (compName: string, targetId?: NodeId, position?: 'before' | 'inside') => void;
  /** Called when an existing node is dragged and dropped onto this node's drop zones. */
  onMove: (dragId: NodeId, targetId?: NodeId, position?: 'before' | 'inside') => void;
  /** Called when this island is clicked — selects it for property editing. */
  onEdit: (id: NodeId) => void;
  /** Called when the delete button is clicked. */
  onDelete: (id: NodeId) => void;
  /** Whether this node is currently selected in the editor. */
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
      {/* Insert-before drop zone — sits above the island header */}
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
        {/* Insert-inside drop zone — always visible at the bottom of the body */}
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

/**
 * The Codefolio visual page editor component.
 *
 * @remarks
 * Provides a full-screen three-pane editing experience:
 * - **Library sidebar** — searchable, categorised palette of all registered
 *   CMS components. Search overrides the active category filter and matches
 *   against component names case-insensitively.
 * - **Structure pane** — drag-and-drop tree of the current page's node hierarchy
 * - **Properties pane** — editable fields for the currently selected node,
 *   rendered via {@link PropField} with support for text, textarea, select and boolean controls
 * - **Preview pane** — live render of the current node tree via {@link Canvas}
 *
 * State is serialised to a hidden `<input>` on every change so the
 * surrounding form captures the full content JSON on submit.
 *
 * @example
 * ```tsx
 * // In a Codefolio admin form:
 * <CanvasEditor data={{ value: page.content, name: "content" }} />
 * ```
 */
const CanvasEditor: React.FC<CodefolioProps<{ value: string; name: string }>> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [nodes, setNodes] = useState<CanvasNode[]>(() => {
    try { return data.value ? JSON.parse(data.value) : []; } catch { return []; }
  });
  const [selectedId, setSelectedId] = useState<NodeId | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  /** All components flagged as CMS-editable. */
  const cmsComponents = useMemo(() => {
    return getAllComponents().filter((c: any) => c.isCmsEditor === true);
  }, []);

  /**
   * Sorted unique category list derived from registered CMS components.
   * "All" is always first, "Uncategorized" always last.
   */
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cmsComponents.forEach((c: any) => cats.add(c.category || "Uncategorized"));
    return ["All", ...Array.from(cats).sort((a, b) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    })];
  }, [cmsComponents]);

  /**
   * Components filtered by both the active category tab and the search query.
   *
   * @remarks
   * When a search query is active, the category filter is ignored and all
   * components whose names contain the query (case-insensitive) are shown.
   * Clearing the search restores the active category filter.
   */
  const filteredLibrary = useMemo(() => {
    if (search.trim()) {
      return cmsComponents.filter((c: any) =>
        c.name.toLowerCase().includes(search.trim().toLowerCase())
      );
    }
    if (activeCategory === "All") return cmsComponents;
    return cmsComponents.filter((c: any) =>
      (c.category || "Uncategorized") === activeCategory
    );
  }, [activeCategory, cmsComponents, search]);

  /** The currently selected {@link CanvasNode}, or null if nothing is selected. */
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

  /** The registry definition for the currently selected node's component. */
  const activeDef = useMemo(
    () => activeNode ? getComponent(activeNode.component) : null,
    [activeNode]
  );

  /**
   * Removes a node and all its descendants from the tree.
   * Clears selection if the deleted node was selected.
   *
   * @param id - The ID of the node to delete.
   */
  const deleteNode = (id: NodeId) => {
    const remove = (list: CanvasNode[]): CanvasNode[] =>
      list.filter(n => n.id !== id).map(n => ({ ...n, children: remove(n.children) }));
    setNodes(prev => remove(prev));
    if (selectedId === id) setSelectedId(null);
  };

  /**
   * Creates a new node from a registered component and inserts it into the tree.
   *
   * @param name - The registered component name to instantiate.
   * @param targetId - The node to insert relative to. If omitted, appends to root.
   * @param position - Whether to insert `'before'` the target or `'inside'` it as a child.
   */
  const addNode = (name: string, targetId?: NodeId, position: 'before' | 'inside' = 'inside') => {
    const def = getComponent(name);
    if (!def) return;
    const newNode: CanvasNode = {
      id: crypto.randomUUID(),
      component: name,
      data: { ...def.defaults },
      children: [],
    };

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

  /**
   * Moves an existing node to a new position in the tree.
   *
   * @remarks
   * Pulls the node out of its current position first, then re-inserts it
   * relative to the target. No-ops if the drag source and target are the same.
   *
   * @param dragId - The ID of the node being moved.
   * @param targetId - The node to insert relative to. If omitted, appends to root.
   * @param position - Whether to insert `'before'` the target or `'inside'` it as a child.
   */
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

  /**
   * Updates a single data key on the currently selected node.
   *
   * @param key - The data key to update.
   * @param val - The new string value.
   */
  const updateNodeData = (key: string, val: string) => {
    setNodes(prev => {
      const map = (list: CanvasNode[]): CanvasNode[] => list.map(n =>
        n.id === selectedId
          ? { ...n, data: { ...n.data, [key]: val } }
          : { ...n, children: map(n.children) }
      );
      return map(prev);
    });
  };

  return (
    <div className="canvas-editor">
      <input type="hidden" name={data.name} value={JSON.stringify(nodes)} />
      {(data as Record<string,any>).label ?? ''}
      <br />
      <Button type="button" onClick={() => setIsOpen(true)}>Visual Editor</Button>

      {isOpen && (
        <div className="editor-overlay">

          {/* ── Library Sidebar ── */}
          <aside className="panel-island side-nav">
            <div className="section-title">
              <i className="fas fa-th-large" /> Library
            </div>

            {/* Search */}
            <div className="library-search">
              <i className="fas fa-search library-search__icon" />
              <input
                type="text"
                className="library-search__input"
                placeholder="Search components..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="library-search__clear"
                  onClick={() => setSearch("")}
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>

            {/* Category capsules — hidden when searching */}
            {!search && (
              <div className="category-capsules">
                {categories.map(cat => (
                  <button
                    type="button"
                    key={cat}
                    className={`capsule ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Component list */}
            <div className="palette-grid">
              {filteredLibrary.length > 0 ? filteredLibrary.map(c => (
                <div
                  key={c.name}
                  className="palette-item"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("componentName", c.name)}
                >
                  <i className={(c as any).icon || "fas fa-cube"} />
                  <span>{c.name}</span>
                </div>
              )) : (
                <div className="palette-empty">
                  <i className="fas fa-search" />
                  <span>No components found</span>
                </div>
              )}
            </div>
          </aside>

          <main className="workspace-container">

            {/* ── 1. Structure Pane ── */}
            <section
              className="workspace-pane blueprint"
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

            {/* ── 2. Properties Pane ── */}
            <section className="workspace-pane properties-pane">
              <div className="pane-label">Properties</div>
              <div className="settings-content">
                {activeNode && activeDef ? (
                  <div className="prop-controls">
                    <div className="editing-badge">{activeNode.component}</div>
                    {Object.keys(activeDef.defaults).map(key => (
                      <PropField
                        key={key}
                        propKey={key}
                        value={activeNode.data[key]}
                        meta={activeDef.fields?.[key]}
                        onChange={val => updateNodeData(key, val)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-hint">Select a block to edit properties</div>
                )}
              </div>
            </section>

            {/* ── 3. Preview Pane ── */}
            <section className="workspace-pane preview">
              <div className="pane-label">Live Preview</div>
              <div className="preview-frame">
                <div className="canvas-wrapper">
                  <Canvas manualNodes={nodes} />
                </div>
                <button
                  type="button"
                  className="close-visual"
                  onClick={() => setIsOpen(false)}
                >
                  Finish
                </button>
              </div>
            </section>

          </main>
        </div>
      )}
    </div>
  );
};

// --- Registration ---
registerComponent({
  name: "CanvasEditor",
  defaults: { value: "", name: "" },
  component: CanvasEditor,
});