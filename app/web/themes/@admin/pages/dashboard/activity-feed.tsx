import { registerComponent } from "@components/registry";
import { FC } from "react";

interface LogEntry {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    timestamp: string;
    timeAgo: string;
    files: string[];
}

interface Props {
    entries: LogEntry[];
}

/** Infer a rough content type from a file path for the badge. */
function inferType(files: string[]): { label: string; mod: string } {
    if (!files.length) return { label: "misc", mod: "misc" };

    const path = files[0].toLowerCase();

    if (path.includes("/pages/"))     return { label: "page",     mod: "page"     };
    if (path.includes("/blogs/"))     return { label: "blog",     mod: "blog"     };
    if (path.includes("/prefabs/"))   return { label: "prefab",   mod: "prefab"   };
    if (path.includes("/documents/")) return { label: "document", mod: "document" };
    if (path.includes("/media/"))     return { label: "media",    mod: "media"    };

    return { label: "misc", mod: "misc" };
}

export const AdminActivityFeed = ({ entries }: Props) => {
    return (
        <div className="admin-widget admin-activity-feed">
            <p className="admin-widget__label">Recent Activity</p>
            <ol className="admin-activity-feed__list">
                {entries.map((entry) => {
                    const { label, mod } = inferType(entry.files);
                    return (
                        <li key={entry.hash} className="admin-activity-feed__item">
                            <span className={`admin-activity-feed__badge admin-activity-feed__badge--${mod}`}>
                                {label}
                            </span>
                            <span className="admin-activity-feed__message">
                                {entry.message}
                            </span>
                            <span className="admin-activity-feed__meta">
                                <code className="admin-activity-feed__hash">{entry.shortHash}</code>
                                <span className="admin-activity-feed__time">{entry.timeAgo}</span>
                            </span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};

registerComponent({
    name: "AdminActivityFeed",
    component: AdminActivityFeed as FC<any>,
    defaults: {},
});