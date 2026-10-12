import { Capacitor } from "@capacitor/core";
import { FileInput } from "./FileInput";
import { useEffect, useRef, useState } from "react";
import { Check, Download, Plus } from "lucide-react";
import { Modal } from "./Modal";
import { appStore, type Recovery } from "../storage";
import {
  MAX_ASSET_BYTES,
  newCampaign,
  uid,
  type AppData,
  type Campaign,
} from "../model";
import { selectAfterRemoval } from "../campaigns";
import {
  backupFilename,
  decodeBackup,
  digest,
  download,
  encodeBackup,
  MAX_BACKUP_BYTES,
  type CampaignBundle,
} from "../backup";

export function CampaignManager({
  data,
  locked,
  onClose,
}: {
  data: AppData;
  locked: boolean;
  onClose: () => void;
}) {
  const current = data.campaigns.find((c) => c.id === data.activeCampaignId);
  const [tab, setTab] = useState<"campaigns" | "attachments" | "backups">(
    "campaigns",
  );
  const confirmationRef = useRef<HTMLDivElement>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<CampaignBundle | null>(null);
  const [mode, setMode] = useState<"copy" | "original">("copy");
  const [confirmed, setConfirmed] = useState(false);
  const [points, setPoints] = useState<Recovery[] | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    label: string;
    description: string;
    name?: string;
    action: () => Promise<unknown>;
  } | null>(null);
  useEffect(() => {
    if (confirmAction) {
      confirmationRef.current?.focus();
      confirmationRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [confirmAction]);
  const [typedName, setTypedName] = useState("");
  const disabled = locked || working;
  const existing =
    preview && data.campaigns.find((c) => c.id === preview.campaign.id);
  async function run(action: () => Promise<unknown>, success = "") {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setWorking(false);
    }
  }
  function confirmDelete(c: Campaign) {
    setTypedName("");
    setConfirmAction({
      label: "Delete campaign permanently",
      name: c.name,
      description: `Delete “${c.name}”, its party, tools, combat and attachments. Local recovery points containing it will also be removed. Export a backup first if you want to keep a copy.`,
      action: () =>
        appStore.change(
          (d) =>
            selectAfterRemoval(
              d,
              d.campaigns.filter((item) => item.id !== c.id),
              c.id,
            ),
          { purgeRecoveryCampaignId: c.id },
        ),
    });
  }
  async function exportCampaign(c: Campaign) {
    const bytes = await encodeBackup(await appStore.bundle(c.id));
    const exported = await download(
      new Blob([bytes], { type: "application/zip" }),
      backupFilename(c.name),
    );
    if (!exported)
      throw new Error("The backup export could not be opened. Try again.");
  }
  return (
    <Modal
      title="Your campaigns"
      wide
      onClose={() => {
        if (!working) onClose();
      }}
    >
      <p className="hint">
        Campaigns keep their own tools, layouts and attachments. Backups include
        unfinished combat.
      </p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {working && (
        <p role="status" className="hint">
          Working…
        </p>
      )}
      <fieldset className="campaign-controls" disabled={disabled}>
        <div
          className="campaign-tabs"
          role="group"
          aria-label="Campaign settings"
        >
          <button
            className="secondary"
            aria-pressed={tab === "campaigns"}
            onClick={() => {
              setTab("campaigns");
              setConfirmAction(null);
            }}
          >
            Campaigns
          </button>
          <button
            className="secondary"
            aria-pressed={tab === "attachments"}
            onClick={() => {
              setTab("attachments");
              setConfirmAction(null);
            }}
          >
            Attachments
          </button>
          <button
            className="secondary"
            aria-pressed={tab === "backups"}
            onClick={() => {
              setTab("backups");
              setConfirmAction(null);
            }}
          >
            Backup &amp; recovery
          </button>
        </div>
        {tab === "campaigns" && (
          <>
            <div className="campaign-list">
              {data.campaigns
                .filter((c) => !c.archivedAt)
                .map((c) => (
                  <div className="campaign-row" key={c.id}>
                    <button
                      className={c.id === current?.id ? "selected" : ""}
                      onClick={() =>
                        void run(async () => {
                          await appStore.change((d) => ({
                            ...d,
                            activeCampaignId: c.id,
                          }));
                          onClose();
                        })
                      }
                    >
                      {c.name}
                      {c.id === current?.id && <Check size={16} />}
                    </button>
                    <button
                      className="quiet"
                      aria-label={`Export ${c.name}`}
                      onClick={() =>
                        void run(
                          () => exportCampaign(c),
                          Capacitor.isNativePlatform()
                            ? "Backup ready to save or share."
                            : "Backup downloaded.",
                        )
                      }
                    >
                      Export
                    </button>
                  </div>
                ))}
              {!data.campaigns.some((c) => !c.archivedAt) && (
                <p className="hint">
                  No active campaigns. Create one, restore an archive, or import
                  a backup.
                </p>
              )}
            </div>
            {current && (
              <section className="campaign-section">
                <form
                  key={current.id}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = String(
                      new FormData(e.currentTarget).get("name"),
                    ).trim();
                    if (name)
                      void run(
                        () =>
                          appStore.change((d) => ({
                            ...d,
                            campaigns: d.campaigns.map((c) =>
                              c.id === current.id ? { ...c, name } : c,
                            ),
                          })),
                        "Campaign renamed.",
                      );
                  }}
                >
                  <label>
                    Rename current campaign
                    <input
                      name="name"
                      defaultValue={current.name}
                      required
                      maxLength={80}
                    />
                  </label>
                  <button className="secondary">Rename</button>
                </form>
                <div className="campaign-actions">
                  <button
                    className="secondary"
                    onClick={() =>
                      void run(
                        () => appStore.duplicate(current.id),
                        "Campaign duplicated. The copy is now active.",
                      )
                    }
                  >
                    Duplicate campaign
                  </button>
                  <button
                    className="secondary"
                    onClick={() =>
                      void run(
                        () =>
                          appStore.change((d) =>
                            selectAfterRemoval(
                              d,
                              d.campaigns.map((c) =>
                                c.id === current.id
                                  ? {
                                      ...c,
                                      archivedAt: new Date().toISOString(),
                                    }
                                  : c,
                              ),
                              current.id,
                            ),
                          ),
                        "Campaign archived. You can restore it below.",
                      )
                    }
                  >
                    Archive campaign
                  </button>
                  <button
                    className="quiet danger"
                    onClick={() => confirmDelete(current)}
                  >
                    Delete campaign
                  </button>
                </div>
              </section>
            )}
            <form
              className="new-campaign-form"
              onSubmit={(e) => {
                e.preventDefault();
                const name = String(
                  new FormData(e.currentTarget).get("name"),
                ).trim();
                if (!name) return;
                const created = newCampaign(name);
                void run(async () => {
                  await appStore.change((d) => ({
                    ...d,
                    campaigns: [
                      ...d.campaigns,
                      {
                        ...created,
                        packRefs: created.packRefs.filter((key) =>
                          d.packs.some(
                            (pack) => `${pack.id}@${pack.version}` === key,
                          ),
                        ),
                      },
                    ],
                    activeCampaignId: created.id,
                  }));
                  onClose();
                });
              }}
            >
              <label>
                New campaign
                <input
                  name="name"
                  required
                  maxLength={80}
                  placeholder="A new adventure"
                />
              </label>
              <button className="primary">
                <Plus size={15} />
                Create campaign
              </button>
            </form>
            {data.campaigns.some((c) => c.archivedAt) && (
              <section className="campaign-section">
                <h3>Archived campaigns</h3>
                {data.campaigns
                  .filter((c) => c.archivedAt)
                  .map((c) => (
                    <div className="attachment-row" key={c.id}>
                      <span>{c.name}</span>
                      <button
                        className="secondary"
                        aria-label={`Restore ${c.name}`}
                        onClick={() =>
                          void run(
                            () =>
                              appStore.change((d) => ({
                                ...d,
                                campaigns: d.campaigns.map((item) =>
                                  item.id === c.id
                                    ? { ...item, archivedAt: null }
                                    : item,
                                ),
                                activeCampaignId: c.id,
                              })),
                            "Campaign restored.",
                          )
                        }
                      >
                        Restore
                      </button>
                      <button
                        className="quiet"
                        aria-label={`Export ${c.name}`}
                        onClick={() =>
                          void run(
                            () => exportCampaign(c),
                            Capacitor.isNativePlatform()
                              ? "Backup ready to save or share."
                              : "Backup downloaded.",
                          )
                        }
                      >
                        Export
                      </button>
                      <button
                        className="quiet danger"
                        aria-label={`Delete ${c.name}`}
                        onClick={() => confirmDelete(c)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
              </section>
            )}
          </>
        )}
        {tab === "attachments" && !current && (
          <p className="hint">
            Select an active campaign to manage its attachments.
          </p>
        )}
        {tab === "attachments" && current && (
          <section className="campaign-section">
            <h3>Campaign attachments</h3>
            <p className="hint">
              Local files included in every backup. Up to 10 MiB each and 64 MiB
              per campaign.
            </p>
            <label className="field-label">
              Add attachments
              <FileInput
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.currentTarget.files ?? []);
                  e.currentTarget.value = "";
                  if (!files.length) return;
                  void run(async () => {
                    if (files.some((f) => f.size > MAX_ASSET_BYTES))
                      throw new Error(
                        "Each attachment must be 10 MiB or smaller.",
                      );
                    const records = await Promise.all(
                      files.map(async (file) => ({
                        id: uid(),
                        name: file.name,
                        mime: file.type,
                        size: file.size,
                        sha256: await digest(
                          new Uint8Array(await file.arrayBuffer()),
                        ),
                      })),
                    );
                    await appStore.change(
                      (d) => ({
                        ...d,
                        campaigns: d.campaigns.map((c) =>
                          c.id === current.id
                            ? { ...c, assets: [...c.assets, ...records] }
                            : c,
                        ),
                      }),
                      {
                        assets: records.map((a, i) => ({
                          campaignId: current.id,
                          id: a.id,
                          blob: files[i],
                        })),
                      },
                    );
                  }, "Attachments saved on this device.");
                }}
              />
            </label>
            {current.assets.map((a) => (
              <div className="attachment-row" key={a.id}>
                <span>
                  {a.name}
                  <small>{(a.size / 1024).toFixed(1)} KiB</small>
                </span>
                <button
                  className="icon-button"
                  aria-label={`Download ${a.name}`}
                  onClick={() =>
                    void run(async () => {
                      const bundle = await appStore.bundle(current.id);
                      const file = bundle.assets.find(
                        (item) => item.id === a.id,
                      );
                      if (!file) throw new Error("Attachment is missing.");
                      download(file.blob, a.name);
                    })
                  }
                >
                  <Download size={16} />
                </button>
                <button
                  className="quiet danger"
                  aria-label={`Remove ${a.name}`}
                  onClick={() =>
                    setConfirmAction({
                      label: "Remove attachment",
                      description: `Remove “${a.name}” from this campaign?`,
                      action: () =>
                        appStore.change((d) => ({
                          ...d,
                          campaigns: d.campaigns.map((c) =>
                            c.id === current.id
                              ? {
                                  ...c,
                                  assets: c.assets.filter(
                                    (meta) => meta.id !== a.id,
                                  ),
                                }
                              : c,
                          ),
                        })),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </section>
        )}
        {tab === "backups" && (
          <>
            <section className="campaign-section">
              {current && (
                <button
                  className="secondary"
                  onClick={() =>
                    void run(
                      () => exportCampaign(current),
                      Capacitor.isNativePlatform()
                        ? "Backup ready to save or share."
                        : "Backup downloaded.",
                    )
                  }
                >
                  <Download size={16} />
                  Export current campaign
                </button>
              )}
              <h3>Import a campaign backup</h3>
              <p className="hint">
                Choose a Slate ZIP backup. Nothing changes until you review and
                restore it.
              </p>
              <label className="field-label">
                Backup file
                <FileInput
                  type="file"
                  accept=".zip"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    e.currentTarget.value = "";
                    setPreview(null);
                    setMode("copy");
                    setConfirmed(false);
                    if (file)
                      void run(async () => {
                        if (file.size > MAX_BACKUP_BYTES)
                          throw new Error("Backup exceeds 128 MiB.");
                        setPreview(
                          await decodeBackup(
                            new Uint8Array(await file.arrayBuffer()),
                          ),
                        );
                      });
                  }}
                />
              </label>
              {preview && (
                <div className="backup-preview">
                  <strong>{preview.campaign.name}</strong>
                  <p className="hint">
                    {preview.campaign.party.characters.length} PCs ·{" "}
                    {preview.campaign.tools.length} tools ·{" "}
                    {preview.campaign.screens.reduce(
                      (sum, s) => sum + s.widgets.length,
                      0,
                    )}{" "}
                    widgets · {preview.assets.length} attachments ·{" "}
                    {
                      preview.campaign.tools.filter(
                        (t) =>
                          t.kind === "initiative" &&
                          t.run.status !== "finished",
                      ).length
                    }{" "}
                    unfinished encounters
                  </p>
                  <label className="field-label">
                    Restore mode
                    <select
                      value={mode}
                      onChange={(e) => {
                        setMode(e.target.value as typeof mode);
                        setConfirmed(false);
                      }}
                    >
                      <option value="copy">
                        Create a separate campaign (new IDs)
                      </option>
                      <option value="original">
                        Restore original campaign (preserve IDs)
                      </option>
                    </select>
                  </label>
                  {mode === "original" && existing && (
                    <label className="confirm-check">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                      />
                      Replace “{existing.name}” with this backup. A local
                      recovery point will be saved first.
                    </label>
                  )}
                  {mode === "original" && !existing && (
                    <p className="hint">
                      The original campaign is not present. It will be added
                      with its original IDs.
                    </p>
                  )}
                  <button
                    className="primary"
                    disabled={mode === "original" && !!existing && !confirmed}
                    onClick={() =>
                      void run(async () => {
                        await appStore.restore(preview, mode);
                        setPreview(null);
                        setPoints(null);
                      }, "Campaign restored and ready to use.")
                    }
                  >
                    Restore backup
                  </button>
                </div>
              )}
            </section>
            <section className="campaign-section">
              <h3>Recovery points</h3>
              <p className="hint">
                The five most recent snapshots before an upgrade or replacement.
                These are on this device; exported backups are your portable
                copies.
              </p>
              <button
                className="secondary"
                onClick={() =>
                  void run(async () =>
                    setPoints(await appStore.recoveryPoints()),
                  )
                }
              >
                Show recovery points
              </button>
              {points?.length === 0 && (
                <p className="hint">No recovery points yet.</p>
              )}
              {points?.map((p) => (
                <div className="attachment-row" key={p.id}>
                  <span>
                    {p.reason}
                    <small>{new Date(p.at).toLocaleString()}</small>
                  </span>
                  <button
                    className="secondary"
                    onClick={() =>
                      setConfirmAction({
                        label: "Restore recovery point",
                        description:
                          "This restores all campaigns and settings to this moment, replacing later changes. A snapshot of the current state will be saved first.",
                        action: async () => {
                          await appStore.recover(p.id);
                          setPoints(null);
                        },
                      })
                    }
                  >
                    Restore snapshot
                  </button>
                </div>
              ))}
            </section>
          </>
        )}
        {confirmAction && (
          <div
            className="confirmation-panel"
            ref={confirmationRef}
            tabIndex={-1}
            role="group"
            aria-label={confirmAction.label}
          >
            <p>{confirmAction.description}</p>
            {confirmAction.name && (
              <label className="field-label">
                Type the campaign name to confirm
                <input
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                />
              </label>
            )}
            <div className="campaign-actions">
              <button
                className="secondary"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className="secondary danger"
                disabled={
                  !!confirmAction.name && typedName !== confirmAction.name
                }
                onClick={() =>
                  void run(async () => {
                    await confirmAction.action();
                    setConfirmAction(null);
                    setPoints(null);
                  }, "Done.")
                }
              >
                {confirmAction.label}
              </button>
            </div>
          </div>
        )}
      </fieldset>
    </Modal>
  );
}
