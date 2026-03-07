import { registerComponent } from "@components/registry";
import { FC } from "react";

interface SiteStats {
    createdAt: string | null;
    totalCommits: number;
    branch: string;
}

interface Props {
    stats: SiteStats;
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function daysAgo(iso: string | null): string {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
}

export const AdminSiteStats = ({ stats }: Props) => {
    return (
        <div className="admin-widget admin-site-stats">
            <p className="admin-widget__label">Repository</p>
            <div className="admin-site-stats__grid">
                <div className="admin-site-stats__item">
                    <span className="admin-site-stats__value">{stats.totalCommits}</span>
                    <span className="admin-site-stats__key">Total commits</span>
                </div>
                <div className="admin-site-stats__item">
                    <span className="admin-site-stats__value admin-site-stats__value--branch">
                        {stats.branch}
                    </span>
                    <span className="admin-site-stats__key">Branch</span>
                </div>
                <div className="admin-site-stats__item">
                    <span className="admin-site-stats__value">{formatDate(stats.createdAt)}</span>
                    <span className="admin-site-stats__key">Created · {daysAgo(stats.createdAt)}</span>
                </div>
            </div>
        </div>
    );
};

registerComponent({
    name: "AdminSiteStats",
    component: AdminSiteStats as FC<any>,
    defaults: {},
});