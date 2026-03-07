import { registerComponent } from "@components/registry"
import { AdminUpdates } from "../../components/updates/update-status"
import { useEffect, useState } from "react";
import { AdminContentStats } from "./content-stats";
import { AdminSiteStats } from "./site-stats";
import { AdminActivityFeed } from "./activity-feed";
import { AdminCommitSparkline } from "./commit-sparkline";
import './style.scss'

// ─── Types (mirrored from VcsService) ────────────────────────────────────────

interface VersionData {
    current: string;
    latest: string;
}

interface ContentStats {
    pages: number;
    blogs: number;
    prefabs: number;
    documents: number;
    media: number;
}

interface LogEntry {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    timestamp: string;
    timeAgo: string;
    files: string[];
}

interface CommitFrequency {
    date: string;
    count: number;
}

interface SiteStats {
    createdAt: string | null;
    totalCommits: number;
    branch: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useDashboardData() {
    const [version,         setVersion]         = useState<VersionData | null>(null);
    const [contentStats,    setContentStats]     = useState<ContentStats | null>(null);
    const [recentActivity,  setRecentActivity]   = useState<LogEntry[]>([]);
    const [commitFrequency, setCommitFrequency]  = useState<CommitFrequency[]>([]);
    const [siteStats,       setSiteStats]        = useState<SiteStats | null>(null);
    const [loading,         setLoading]          = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/content/en-admin/version.json').then((r)          => r.json()),
            fetch('/content/en-admin/content-stats.json').then((r)    => r.json()),
            fetch('/content/en-admin/recent-activity.json').then((r)  => r.json()),
            fetch('/content/en-admin/commit-frequency.json').then((r) => r.json()),
            fetch('/content/en-admin/site-stats.json').then((r)       => r.json()),
        ])
        .then(([version, contentStats, recentActivity, commitFrequency, siteStats]) => {
            setVersion(version);
            setContentStats(contentStats);
            setRecentActivity(recentActivity);
            setCommitFrequency(commitFrequency);
            setSiteStats(siteStats);
        })
        .finally(() => setLoading(false));
    }, []);

    return { version, contentStats, recentActivity, commitFrequency, siteStats, loading };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AdminDashboard = () => {
    const { version, contentStats, recentActivity, commitFrequency, siteStats, loading } = useDashboardData();

    if (loading) return <div className='admin-dashboard admin-dashboard--loading' />;

    return (
        <div className='admin-dashboard'>
            {version && (
                <AdminUpdates
                    data={{
                        currentVersion: version.current,
                        latest: version.latest
                    }}
                />
            )}
            {contentStats && (
                <AdminContentStats stats={contentStats} />
            )}
            {siteStats && (
                <AdminSiteStats stats={siteStats} />
            )}
            {recentActivity.length > 0 && (
                <AdminActivityFeed entries={recentActivity} />
            )}
            {commitFrequency.length > 0 && (
                <AdminCommitSparkline frequency={commitFrequency} />
            )}
        </div>
    )
}

registerComponent({
    name: 'AdminDashboard',
    component: AdminDashboard,
    defaults: {}
})