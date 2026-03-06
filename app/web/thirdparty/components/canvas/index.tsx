import React, { ReactNode, FC, createElement } from "react";
import { Fragment, JSX } from "react/jsx-runtime";
import { useRouter } from '@router';
import { getComponent, registerComponent } from '../registry';
import { CanvasNode } from "./types";
import { Alert, AlertData } from "@components/alert";

/**
 * Maps content JSON component names to their HTML fallback tag when no
 * registered component is found in the registry.
 * @internal
 */
const htmlFallback: Record<string, keyof JSX.IntrinsicElements> = {
  text: "span",
};

/**
 * Recursively renders a single {@link CanvasNode} and all of its descendants
 * into a React node tree.
 *
 * Resolution order for each node:
 * 1. Looks up the `component` name in the component registry via
 *    {@link getComponent}. If found, invokes the registered React component
 *    via {@link createElement} with `data` and `children` as props.
 * 2. Falls back to the {@link htmlFallback} map for a semantic HTML tag.
 * 3. Falls back to `<div>` if the component name is not in either registry.
 *
 * @remarks
 * `createElement` is used for registered components rather than JSX so that
 * dynamically resolved component references are correctly invoked by React
 * rather than treated as unknown HTML elements.
 *
 * `textContent` is treated as a reserved field on the `data` payload — it
 * is stripped from the props spread and used as the text content of the
 * fallback HTML element instead.
 *
 * @param node - The {@link CanvasNode} to render.
 * @returns A React node, or `null` if the node is falsy.
 */
const renderNode = (node: CanvasNode): ReactNode => {
  if (!node) return null;

  const { component: type, data = {}, children = [] } = node;

  const registered = getComponent(type);

  // Depth-first: render children before passing them to the parent component.
  const renderedChildren = children.map((child, idx) => (
    <Fragment key={idx}>{renderNode(child)}</Fragment>
  ));

  if (registered) {
    // Use createElement directly — JSX with a runtime-resolved component
    // reference can cause React to treat it as an unknown HTML element
    // rather than invoking the function, producing raw attribute output.
    return createElement(
      registered.component,
      { data },
      renderedChildren.length ? renderedChildren : undefined
    );
  }

  // Fall back to a semantic HTML tag or <div> for unregistered components.
  const HtmlTag = htmlFallback[type] || "div";

  // textContent is reserved — render it as element content, not a DOM prop.
  const { textContent, ...restProps } = data;

  return createElement(
    HtmlTag as string,
    restProps,
    renderedChildren.length ? renderedChildren : textContent || null
  );
};

/**
 * The root renderer for Codefolio's content tree.
 *
 * Reads the current page's {@link CanvasNode} tree from the router and
 * recursively renders it via {@link renderNode}. Every public page and
 * admin page in Codefolio is currently rendered through this component.
 *
 * @remarks
 * `Canvas` is itself registered in the component registry under `"canvas"`,
 * meaning a content JSON tree can embed a nested canvas as a child node.
 *
 * @example
 * ```tsx
 * <ThemeLoader>
 *   <Canvas />
 * </ThemeLoader>
 * ```
 */
export const Canvas: React.FC = () => {
  const { pageContent } = useRouter();

  if (!pageContent) return <div>Loading...</div>;

  return <>{renderNode(pageContent as CanvasNode)}</>;
};

registerComponent({
  name: "canvas",
  defaults: {},
  component: Canvas as React.FC<any>,
});