import { Service } from "@decorators/service";
import { publish } from "@events";

export type AdminNavMenuItem = {
    label: string,
    fasIcon?: string,
    href: string,
    key: string,
    parent?: string,
    sortOrder?: number,
}

export type AdminNavTreeItem = {
    label: string,
    href?: string,
    fasIcon?: string,
    sortOrder?: number,
    parent?: string,
    children: AdminNavTreeItem[],
}

@Service()
export class AdminNavService
{
    private items: AdminNavMenuItem[] = [];

    public async add(item: AdminNavMenuItem)
    {
        item = await publish('nav-entry', item);
        this.items.push(item);
    }

    public toTree(): AdminNavTreeItem[]
    {
        const root: AdminNavTreeItem[] = [];
        const map = new Map<string, AdminNavTreeItem>();

        // Deduplicate by key — last registration wins (subclass overrides parent)
        const deduped = Array.from(
            this.items
                .reduce((acc, item) => {
                    acc.set(item.key, item);
                    return acc;
                }, new Map<string, AdminNavMenuItem>())
                .values()
        );

        // Sort by sortOrder before building tree
        deduped.sort((a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100));

        // First pass — build map
        for (const item of deduped) {
            map.set(item.key, {
                label: item.label,
                href: item.href,
                fasIcon: item.fasIcon,
                sortOrder: item.sortOrder,
                parent: item.parent,
                children: [],
            });
        }

        // Second pass — wire up parents
        for (const item of deduped) {
            const node = map.get(item.key)!;
            if (item.parent) {
                let parentNode = map.get(item.parent);
                if (!parentNode) {
                    // Parent key not registered — create a label-only group
                    parentNode = { label: item.parent, children: [] };
                    map.set(item.parent, parentNode);
                    root.push(parentNode);
                }
                parentNode.children.push(node);
            } else {
                root.push(node);
            }
        }

        return root;
    }
}