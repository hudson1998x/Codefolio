import { CanvasNode } from "../frontend/types";

declare module "react" {
  export const h: (type: string | Function, props: Record<string, any> | null, ...children: any[]) => CanvasNode;
  export const Fragment: (props: { children?: CanvasNode[] }) => CanvasNode[];
}

declare global {
  namespace JSX {
    type Element = CanvasNode;

    interface IntrinsicElements {
      [component: string]: Record<string, any>;
    }

    interface IntrinsicAttributes {
      [key: string]: any;
    }

    interface ElementChildrenAttribute {
      children: {};
    }

    // This is the key — tells TypeScript that any identifier
    // used as a JSX tag is valid, no import required
    type ElementType = string | ((props: any) => any);
  }
}