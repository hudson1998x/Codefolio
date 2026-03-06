import { CodefolioProps, registerComponent } from "@components/registry";
import { FC, useState } from "react";
import "./style.scss";

type UpdateState = "idle" | "running" | "done" | "error";

const AdminUpdates: FC<CodefolioProps> = ({ data }) => {
  const { currentVersion, latest } = data;
  const isUnknown = latest === "Unknown";
  const needsUpdate = !isUnknown && currentVersion !== latest;

  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runUpdate = async () => {
    setUpdateState("running");
    setErrorMessage(null);

    try {
      const response = await fetch("/content/en-admin/update");
      const result = await response.json();

      if (result.success) {
        setUpdateState("done");
      } else {
        setErrorMessage(result.message ?? "An unknown error occurred.");
        setUpdateState("error");
      }
    } catch (e: any) {
      setErrorMessage(e?.message ?? "Failed to reach the update endpoint.");
      setUpdateState("error");
    }
  };

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

      {needsUpdate && updateState === "idle" && (
        <button className="admin-updates__button" onClick={runUpdate}>
          Update to v{latest}
        </button>
      )}

      {updateState === "running" && (
        <div className="admin-updates__status is-running">
          <span className="admin-updates__spinner" />
          <span>Updating, please wait…</span>
        </div>
      )}

      {updateState === "done" && (
        <div className="admin-updates__status is-done">
          <span className="admin-updates__status-icon">✓</span>
          <span>Update complete. Please restart the process for changes to take effect.</span>
        </div>
      )}

      {updateState === "error" && (
        <div className="admin-updates__status is-error">
          <span className="admin-updates__status-icon">✕</span>
          <span>{errorMessage}</span>
          <button className="admin-updates__button is-retry" onClick={runUpdate}>
            Retry
          </button>
        </div>
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