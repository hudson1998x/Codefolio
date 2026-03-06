import { CodefolioProps, registerComponent } from "@components/registry";
import { FC } from "react";
import "./style.scss";

const AdminUpdates: FC<CodefolioProps> = ({ data }) => {
  const { currentVersion, latest } = data;
  const isUnknown = latest === "Unknown";
  const needsUpdate = !isUnknown && currentVersion !== latest;

  return (
    <div className="admin-updates">
      <header className="admin-updates__header">
        <h3 className="admin-updates__title">System Status</h3>
        <span className={`admin-updates__dot ${isUnknown ? "is-syncing" : "is-active"}`} />
      </header>

      <div className="admin-updates__content">
        <div className="admin-updates__row">
          <span className="admin-updates__label">Current Version</span>
          <span className="admin-updates__value">v{currentVersion}</span>
        </div>

        <div className="admin-updates__row">
          <span className="admin-updates__label">Latest Release</span>
          <span className={`admin-updates__badge ${isUnknown ? "is-pending" : "is-success"}`}>
            {isUnknown ? "Checking..." : `v${latest}`}
          </span>
        </div>
      </div>

      {needsUpdate && (
        <button className="admin-updates__button">
          Update to v{latest}
        </button>
      )}
    </div>
  );
};

registerComponent({
  name: "AdminUpdates",
  component: AdminUpdates,
  defaults: {
    data: {
      currentVersion: "1.0.0",
      latest: "Unknown",
    },
  },
});