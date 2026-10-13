import { useState } from "react";
import { appStore } from "../storage";
import { download, encodeRecovery } from "../backup";
import { Modal } from "./Modal";

export function LocalDataRecovery({
  error,
  busy,
}: {
  error: string;
  busy: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const locked = busy || exporting;
  async function exportOriginal() {
    setExporting(true);
    setMessage("");
    try {
      const raw = await appStore.raw();
      const saved = await download(
        new Blob([await encodeRecovery(raw)], { type: "application/zip" }),
        "slate-original-recovery.zip",
      );
      if (!saved)
        setMessage(
          "The recovery copy could not be exported. Local data was not changed.",
        );
    } catch (e) {
      setMessage(`The recovery copy could not be exported. ${String(e)}`);
    } finally {
      setExporting(false);
    }
  }
  return (
    <main className="loading-screen" aria-label="Local data recovery">
      <img
        src={`${import.meta.env.BASE_URL}slate.svg`}
        alt=""
        width={52}
        height={52}
      />
      <h1>Slate</h1>
      <p role={error ? "alert" : "status"}>{error || "Opening your table…"}</p>
      {error && (
        <>
          <p>
            You can export the original data for recovery, try opening it again,
            or reset Slate on this device.
          </p>
          <button
            className="secondary"
            disabled={locked}
            onClick={() => void exportOriginal()}
          >
            Export original data
          </button>
          <button
            className="primary"
            disabled={locked}
            onClick={() => location.reload()}
          >
            Try again
          </button>
          <button
            className="secondary danger"
            disabled={locked}
            onClick={() => {
              setMessage("");
              setConfirm(true);
            }}
          >
            Reset local data
          </button>
          {message && <p role="alert">{message}</p>}
          {busy && (
            <p role="status">
              Resetting local data… Close other Slate tabs if this is waiting.
            </p>
          )}
          {confirm && (
            <Modal
              title="Reset local data?"
              dismissible={!locked}
              onClose={() => {
                if (!locked) setConfirm(false);
              }}
            >
              <p>
                This permanently deletes Slate's campaigns, custom content,
                installed packs, attachments and recovery points on this device.
                Downloaded backups are kept.
              </p>
              <p>
                Slate will start with a new default campaign and the bundled
                official packs. Export the original data first if you want to
                keep a recovery copy.
              </p>
              <div className="content-actions">
                <button
                  className="secondary"
                  disabled={locked}
                  onClick={() => void exportOriginal()}
                >
                  Export original data
                </button>
                <button
                  className="secondary"
                  disabled={locked}
                  onClick={() => setConfirm(false)}
                >
                  Keep local data
                </button>
                <button
                  className="secondary danger"
                  disabled={locked}
                  onClick={() => {
                    setMessage("");
                    void appStore
                      .resetLocalData()
                      .then(() => setConfirm(false))
                      .catch((e) => setMessage(`Reset failed. ${String(e)}`));
                  }}
                >
                  Delete local data and start over
                </button>
              </div>
              {message && <p role="alert">{message}</p>}
              {busy && (
                <p role="status">
                  Resetting local data… Close other Slate tabs if this is
                  waiting.
                </p>
              )}
            </Modal>
          )}
        </>
      )}
    </main>
  );
}
