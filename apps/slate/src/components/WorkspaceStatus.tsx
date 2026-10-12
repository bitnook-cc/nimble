import { useEffect, useState, useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";
import { appStore } from "../storage";
import { encodeBackup, download } from "../backup";

type WorkspaceStatusProps = { offlineReady: boolean; arranging: boolean };
export function WorkspaceStatus({
  offlineReady,
  arranging,
}: WorkspaceStatusProps) {
  const snapshot = useSyncExternalStore(
    appStore.subscribe,
    appStore.getSnapshot,
  );
  const [storage, setStorage] = useState<{
    persisted?: boolean;
    usage?: number;
    quota?: number;
    error?: string;
  }>({});
  const [busy, setBusy] = useState(false),
    [result, setResult] = useState<{
      revision: number;
      campaignId: string;
      text: string;
    }>();
  const [error, setError] = useState("");
  const development = import.meta.env.DEV,
    native = Capacitor.isNativePlatform();
  const campaignId = snapshot.data?.activeCampaignId;
  const label = development
    ? "Development preview"
    : offlineReady
      ? "Ready for offline play"
      : "Preparing offline play…";
  async function inspectStorage() {
    if (Capacitor.isNativePlatform()) return;
    try {
      const persisted = await navigator.storage?.persisted?.();
      const estimate = await navigator.storage?.estimate?.();
      setStorage({ persisted, usage: estimate?.usage, quota: estimate?.quota });
    } catch {
      setStorage({
        error: "Storage estimates are unavailable in this browser.",
      });
    }
  }
  useEffect(() => {
    void inspectStorage();
  }, []);
  async function protect() {
    setBusy(true);
    setError("");
    try {
      const granted = await navigator.storage?.persist?.();
      await inspectStorage();
      if (!granted)
        setError(
          "This browser has not granted persistent storage. Keep a campaign backup outside the app.",
        );
    } catch {
      setError(
        "Persistent storage is unavailable. Keep a campaign backup outside the app.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function checkBackup(exportFile = false) {
    if (!campaignId) return;
    setBusy(true);
    setError("");
    try {
      const bundle = await appStore.bundle(campaignId);
      const revision = appStore.getSnapshot().data!.revision;
      const bytes = await encodeBackup(bundle);
      setResult({
        revision,
        campaignId,
        text: `Backup verified: ${bundle.campaign.assets.length} local attachments and ${bundle.packs?.length ?? 0} enabled packs. All attachment checksums match.`,
      });
      if (exportFile)
        await download(
          new Blob([bytes], { type: "application/zip" }),
          `slate-${bundle.campaign.name.replace(/[^a-z0-9-]/gi, "-")}.zip`,
        );
      await inspectStorage();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to verify the campaign backup.",
      );
    } finally {
      setBusy(false);
    }
  }
  const fresh =
    result?.campaignId === campaignId &&
    result?.revision === snapshot.data?.revision &&
    snapshot.status === "saved";
  return (
    <>
      <button
        className="workspace-status"
        popoverTarget="workspace-status-details"
        aria-label="Workspace status"
      >
        <i className={offlineReady ? "ready-dot" : "muted-dot"} />
        <span>{label}</span>
      </button>
      <div
        id="workspace-status-details"
        className="workspace-status-popover"
        popover="auto"
        role="region"
        aria-label="Workspace status details"
      >
        <h2>Offline &amp; storage</h2>
        <p>
          {native
            ? "Slate uses bundled app assets for offline play. Campaigns and attachments save in native storage."
            : development
              ? "Your campaign saves on this device. Offline app caching is available in the production build."
              : offlineReady
                ? "Slate is cached for offline play. Your campaigns and tools save on this device."
                : "Slate is caching the app for offline play. Your campaigns and tools save on this device."}
        </p>
        <div className="offline-checks">
          <p className="hint">
            Local changes:{" "}
            {snapshot.status === "saved"
              ? "saved"
              : snapshot.status === "saving"
                ? "saving"
                : "not saved"}
            .
          </p>
          <p className="hint">
            {native
              ? "Campaigns and attachments use native SQLite storage. Device validation remains a release requirement."
              : storage.persisted === true
                ? "Browser storage protection: granted."
                : storage.persisted === false
                  ? "Browser storage protection: not granted."
                  : "Browser storage protection: unavailable."}{" "}
            {native
              ? "Uninstalling the app deletes local campaigns."
              : "Clearing site data still deletes local campaigns."}
          </p>
          {storage.usage !== undefined && storage.quota !== undefined && (
            <p className="hint">
              This site's estimated storage:{" "}
              {(storage.usage / 1024 / 1024).toFixed(1)} MiB of{" "}
              {(storage.quota / 1024 / 1024).toFixed(0)} MiB. Available space
              may change.
            </p>
          )}
          {storage.error && <p className="hint">{storage.error}</p>}
          <div className="utility-actions">
            {!native && storage.persisted !== true && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void protect()}
              >
                Request storage protection
              </button>
            )}
            <button
              className="secondary"
              disabled={
                busy || snapshot.busy || snapshot.conflict || !campaignId
              }
              onClick={() => void checkBackup()}
            >
              Check campaign backup
            </button>
            <button
              className="primary"
              disabled={
                busy || snapshot.busy || snapshot.conflict || !campaignId
              }
              onClick={() => void checkBackup(true)}
            >
              Download backup
            </button>
          </div>
          {busy && (
            <p role="status" className="hint">
              Checking local storage…
            </p>
          )}
          {fresh && (
            <p role="status" className="hint">
              {result!.text}
            </p>
          )}
          {result && !fresh && (
            <p className="hint">
              The campaign changed since its last backup check. Check again
              before packing up.
            </p>
          )}
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          <p className="hint">
            Before a session: wait for offline readiness, check your backup,
            download a copy, then reload with networking disabled to verify this
            device. Browser protection reduces automatic eviction; it does not
            replace backups.
          </p>
        </div>
        {arranging && (
          <p>
            Drag a widget by its grip. Resize from its lower corner. Arrow keys
            on these handles move or resize one cell at a time. Click an empty
            cell to add a widget.
          </p>
        )}
      </div>
    </>
  );
}
