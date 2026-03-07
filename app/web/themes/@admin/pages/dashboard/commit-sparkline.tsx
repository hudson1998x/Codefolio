import { registerComponent } from "@components/registry";
import { FC } from "react";

interface CommitFrequency {
    date: string;
    count: number;
}

interface Props {
    frequency: CommitFrequency[];
}

function formatShortDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const AdminCommitSparkline = ({ frequency }: Props) => {
    const max = Math.max(...frequency.map((d) => d.count), 1);
    const total = frequency.reduce((sum, d) => sum + d.count, 0);
    const activeDays = frequency.filter((d) => d.count > 0).length;

    // SVG sparkline path
    const width  = 100;
    const height = 28;
    const step   = width / (frequency.length - 1);

    const points = frequency.map((d, i) => {
        const x = i * step;
        const y = height - (d.count / max) * height;
        return `${x},${y}`;
    });

    const linePath  = `M ${points.join(" L ")}`;
    const areaPath  = `M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`;

    return (
        <div className="admin-widget admin-commit-sparkline">
            <p className="admin-widget__label">Commit Activity · last 30 days</p>
            <div className="admin-commit-sparkline__body">
                <div className="admin-commit-sparkline__stats">
                    <div className="admin-commit-sparkline__stat">
                        <span className="admin-commit-sparkline__stat-value">{total}</span>
                        <span className="admin-commit-sparkline__stat-label">commits</span>
                    </div>
                    <div className="admin-commit-sparkline__stat">
                        <span className="admin-commit-sparkline__stat-value">{activeDays}</span>
                        <span className="admin-commit-sparkline__stat-label">active days</span>
                    </div>
                </div>
                <svg
                    className="admin-commit-sparkline__svg"
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="currentColor" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0"    />
                        </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#sparkline-fill)" />
                    <path d={linePath} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <div className="admin-commit-sparkline__axis">
                    <span>{formatShortDate(frequency[0].date)}</span>
                    <span>{formatShortDate(frequency[frequency.length - 1].date)}</span>
                </div>
            </div>

            <div className="admin-commit-sparkline__bars" aria-label="Daily commit counts">
                {frequency.map((d) => (
                    <div
                        key={d.date}
                        className={`admin-commit-sparkline__bar${d.count === 0 ? " admin-commit-sparkline__bar--empty" : ""}`}
                        style={{ "--bar-height": `${(d.count / max) * 100}%` } as React.CSSProperties}
                        title={`${formatShortDate(d.date)}: ${d.count} commit${d.count !== 1 ? "s" : ""}`}
                    />
                ))}
            </div>
        </div>
    );
};

registerComponent({
    name: "AdminCommitSparkline",
    component: AdminCommitSparkline as FC<any>,
    defaults: {},
});