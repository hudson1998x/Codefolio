import { getComponent } from "@components/registry";
import { ReactNode, createElement } from "react";
import { Fragment } from "react/jsx-runtime";
import { CanvasNode } from "./types";

export const renderNode = (node: CanvasNode): ReactNode => {
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

export const Canvas: React.FC<{ manualNodes?: CanvasNode[] }> = ({ manualNodes }) => {
  if (manualNodes && manualNodes.length > 0) {
    return <>{manualNodes.map(node => renderNode(node))}</>;
  }
  return <div className="canvas-placeholder">Drag components here to start building.</div>;
};