import { h, Fragment } from "./index";
import { CanvasNode } from "../frontend/types";

declare global {
  var h: (type: string | Function, props: Record<string, any> | null, ...children: any[]) => CanvasNode;
  var Fragment: (props: { children?: CanvasNode[] }) => CanvasNode[];
}

globalThis.h = h;
globalThis.Fragment = Fragment;