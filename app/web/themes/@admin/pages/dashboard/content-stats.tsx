import { registerComponent } from "@components/registry";
import { FC } from "react";

interface ContentStats {
    pages: number;
    blogs: number;
    prefabs: number;
    documents: number;
    media: number;
}

interface Props {
    stats: ContentStats;
}

const ITEMS: { key: keyof ContentStats; label: string; icon: string }[] = [
    { key: "pages",     label: "Pages",     icon: "fas fa-pager" },
    { key: "blogs",     label: "Blog Posts", icon: "fas fa-rss"  },
    { key: "prefabs",   label: "Prefabs",   icon: "fas fa-cubes"  },
    { key: "documents", label: "Documents", icon: "fas fa-file-contract"  },
    { key: "media",     label: "Media",     icon: "fas fa-image"  },
];

export const AdminContentStats = ({ stats }: Props) => {
    return (
        <div className="admin-widget admin-content-stats">
            <p className="admin-widget__label">Content</p>
            <div className="admin-content-stats__grid">
                {ITEMS.map(({ key, label, icon }) => (
                    <div key={key} className="admin-content-stats__item">
                        <span className="admin-content-stats__icon"><i className={icon}/></span>
                        <span className="admin-content-stats__count">{stats[key]}</span>
                        <span className="admin-content-stats__name">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

registerComponent({
    name: "AdminContentStats",
    component: AdminContentStats as FC<any>,
    defaults: {},
});