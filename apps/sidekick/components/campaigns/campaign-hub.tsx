"use client";

import { campaigns } from "@nimble/shared";

import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";

import { useAuth } from "@/lib/hooks/use-auth";
import { useThemeInit } from "@/lib/hooks/use-theme-init";
import { Character } from "@/lib/schemas/character";
import { inventorySchema } from "@/lib/schemas/inventory";
import { CampaignRequestError, campaignService } from "@/lib/services/campaign-service";
import { getCharacterService, getCharacterStorage } from "@/lib/services/service-factory";
import { syncService } from "@/lib/services/sync/sync-service";
import { apiFetch } from "@/lib/utils/api";

import { AuthButton } from "../auth-button";
import { Button } from "../ui/button";
import { Encounters } from "./encounters";
import { Inventory } from "./inventory";
import { CloudInventory, InventoryReview } from "./inventory-review";
import { Journal, Sessions } from "./journal";
import { Party } from "./party";
import { Field, Panel, formValues, inputClass, string, uid } from "./shared";

const tabs = [
  "Party",
  "Inventory",
  "Journal",
  "Encounters",
  "Sessions",
  "Activity",
  "Settings",
] as const;
export function CampaignHub() {
  useThemeInit();
  const { user, loading } = useAuth();
  const [list, setList] = useState<campaigns.CampaignSummary[]>([]);
  const [id, setId] = useState("");
  const [invite, setInvite] = useState("");
  const [view, setView] = useState<campaigns.CampaignView | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Party");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [inventories, setInventories] = useState<CloudInventory[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [draftRevision, setDraftRevision] = useState<number | null>(null);
  const [lastRead, setLastRead] = useState<Date | null>(null);
  const epoch = useRef(0);
  const locked = useRef(false);
  const pending = useRef<{ key: string; id: string } | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setId(params.get("campaign") || "");
    // Invite tokens are kept out of referrers, history, and persistent storage.
    setInvite(params.get("invite") || "");
    if (params.has("invite")) {
      params.delete("invite");
      window.history.replaceState({}, "", `/campaigns/${params.size ? `?${params}` : ""}`);
    }
  }, []);
  const loadCharacters = useCallback(async () => {
    setCharacters(await getCharacterStorage().getAllCharacters());
    const response = await apiFetch("/sync/inventories", {
      credentials: "include",
      cache: "no-store",
    });
    if (response.ok) setInventories(await response.json());
  }, []);
  const select = (campaignId: string) => {
    epoch.current++;
    setDraftRevision(null);
    setView(null);
    setLastRead(null);
    setError("");
    setNotice("");
    setInviteLink("");
    setId(campaignId);
    setTab("Party");
    window.history.replaceState(
      {},
      "",
      `/campaigns/${campaignId ? `?campaign=${encodeURIComponent(campaignId)}` : ""}`,
    );
  };
  const refresh = useCallback(async () => {
    if (!id || !user) return;
    const generation = epoch.current;
    try {
      const result = await campaignService.view(id);
      if (generation !== epoch.current) return;
      setView((current) =>
        !current || current.id !== result.id || result.revision >= current.revision
          ? result
          : current,
      );
      setLastRead(new Date());
    } catch (error) {
      if (generation !== epoch.current) return;
      if (error instanceof CampaignRequestError && [401, 403, 404].includes(error.status)) {
        setView(null);
        setInviteLink("");
      }
      setError((error as Error).message || "Unable to refresh. Check your connection.");
    }
  }, [id, user]);
  useEffect(() => {
    epoch.current++;
    if (!user) {
      setView(null);
      setList([]);
      setCharacters([]);
      setInventories([]);
      return;
    }
    const generation = epoch.current;
    void campaignService
      .list()
      .then((items) => {
        if (generation === epoch.current) setList(items);
      })
      .catch((e) => setError(e.message));
    void loadCharacters().catch((e) => setError(e.message));
    void refresh();
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 15000);
    const onFocus = () => void refresh();
    const onSync = () => {
      void loadCharacters();
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("characters-synced", onSync);
    const unsubscribe = id ? campaignService.subscribe(id, user.id, onFocus) : () => {};
    return () => {
      epoch.current++;
      window.clearInterval(timer);
      unsubscribe();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("characters-synced", onSync);
    };
  }, [user, id, refresh, loadCharacters]);
  const run = async (fn: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message || "Unable to save. Check your connection and retry.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const sync = async () =>
    run(async () => {
      const result = await syncService.syncCharacters();
      if (!result) throw new Error("Sign in to sync characters.");
      await loadCharacters();
      await refresh();
      setNotice("Characters synced.");
    });
  const command = async (command: campaigns.Command): Promise<boolean> => {
    if (!view || !user || locked.current) return false;
    let success = false;
    await run(async () => {
      if (draftRevision !== null && draftRevision !== view.revision)
        throw new Error(
          "Campaign changed while you were editing. Review the changes and use the latest version before saving.",
        );
      const transfer =
        command.type === "transfer" ||
        (command.type === "currency" && command.direction !== "award");
      if (transfer && command.userId === user.id) {
        try {
          const synced = await syncService.syncCharacters();
          if (!synced) throw new Error("Sign in to sync before transferring items.");
        } catch (e) {
          await loadCharacters();
          await refresh();
          setTab("Inventory");
          throw e;
        }
      }
      const key = JSON.stringify({ campaign: view.id, command });
      if (pending.current?.key !== key) pending.current = { key, id: uid() };
      try {
        await campaignService.mutate(view.id, {
          operationId: pending.current.id,
          expectedRevision: view.revision,
          command,
        });
        pending.current = null;
        success = true;
        setDraftRevision(null);
      } catch (e) {
        await refresh();
        await loadCharacters();
        throw e;
      }
      if (command.type === "member" && command.action === "remove" && command.userId === user.id) {
        select("");
        setList(await campaignService.list());
        return;
      }
      await refresh();
      await loadCharacters();
      setNotice(
        transfer
          ? "Transfer saved. The character owner can review their cloud inventory below."
          : "Saved.",
      );
    });
    return success;
  };
  const resolve = async (cloud: CloudInventory) =>
    run(async () => {
      const inventory = inventorySchema.parse(cloud.inventory);
      await getCharacterStorage().acceptCampaignInventory(
        cloud.characterId,
        inventory,
        cloud.revision,
      );
      const current = getCharacterService().getCurrentCharacter();
      if (current?.id === cloud.characterId)
        await getCharacterService().loadCharacter(cloud.characterId);
      try {
        await syncService.syncCharacters();
      } finally {
        await loadCharacters();
        await refresh();
      }
      setNotice("Cloud inventory accepted. Your other character edits were kept.");
    });
  const props = view && user ? { view, userId: user.id, command, busy } : null;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="font-semibold">
            ← Sidekick
          </Link>
          <h1 className="text-xl font-semibold">Campaigns</h1>
          <AuthButton />
        </div>
      </header>
      <div className="mx-auto max-w-7xl p-5 md:p-8 space-y-6">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive bg-destructive/5 p-4 text-sm"
          >
            {error}
          </div>
        )}
        {notice && (
          <p role="status" className="rounded-lg border bg-muted/40 p-3 text-sm">
            {notice}
          </p>
        )}
        {loading ? (
          <p role="status">Loading your account…</p>
        ) : !user ? (
          <Panel title="Bring your party together">
            <p>Sign in above to create a campaign or join your GM&apos;s invitation.</p>
            <p className="text-sm text-muted-foreground">
              Campaigns keep your party, shared treasure, quests, and encounters in one place.
            </p>
          </Panel>
        ) : (
          <>
            {inventories.map((cloud) => {
              const local = characters.find((c) => c.id === cloud.characterId);
              return local && (local._inventoryRevision || 0) !== cloud.revision ? (
                <InventoryReview
                  key={cloud.characterId}
                  local={local}
                  cloud={cloud}
                  busy={busy}
                  accept={() => resolve(cloud)}
                />
              ) : null;
            })}
            {invite && (
              <Panel title="Campaign invitation">
                <p className="text-sm">
                  Join with this account. You can choose which character to share afterwards.
                </p>
                <Button
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const result = await campaignService.join(invite);
                      setInvite("");
                      select(result.id);
                      setList(await campaignService.list());
                    })
                  }
                >
                  Accept invitation
                </Button>
              </Panel>
            )}
            <div className="flex flex-wrap gap-3 items-end">
              <Field label="Your campaigns">
                <select className={inputClass} value={id} onChange={(e) => select(e.target.value)}>
                  <option value="">Choose or create a campaign</option>
                  {list.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.role === "GM" ? "GM" : "Player"}
                    </option>
                  ))}
                </select>
              </Field>
              {id && (
                <Button variant="outline" disabled={busy} onClick={() => void refresh()}>
                  Refresh
                </Button>
              )}
              <Button variant="ghost" onClick={() => select("")}>
                New campaign
              </Button>
            </div>
            {!id && (
              <div className="grid gap-6 md:grid-cols-2">
                <Panel title="Start a campaign">
                  <form
                    className="grid gap-4"
                    onSubmit={(e) => {
                      const d = formValues(e);
                      void run(async () => {
                        const result = await campaignService.create(
                          string(d, "name"),
                          string(d, "description"),
                        );
                        select(result.id);
                        setList(await campaignService.list());
                      });
                    }}
                  >
                    <Field label="Campaign name">
                      <input
                        className={inputClass}
                        name="name"
                        required
                        maxLength={120}
                        placeholder="The Ashen Road"
                      />
                    </Field>
                    <Field label="Description">
                      <textarea
                        className={inputClass}
                        name="description"
                        maxLength={10000}
                        rows={4}
                      />
                    </Field>
                    <Button disabled={busy}>Create campaign</Button>
                  </form>
                </Panel>
                <Panel title="Join your GM">
                  <form
                    className="grid gap-4"
                    onSubmit={(e) => {
                      const d = formValues(e);
                      void run(async () => {
                        const value = string(d, "link").trim();
                        let token = value;
                        try {
                          token = new URL(value).searchParams.get("invite") || value;
                        } catch {
                          /* A raw token is also accepted. */
                        }
                        const result = await campaignService.join(token);
                        select(result.id);
                        setList(await campaignService.list());
                      });
                    }}
                  >
                    <Field label="Invitation link">
                      <input
                        className={inputClass}
                        name="link"
                        required
                        placeholder="Paste your GM’s invitation"
                        autoComplete="off"
                      />
                    </Field>
                    <Button disabled={busy}>Join campaign</Button>
                  </form>
                </Panel>
              </div>
            )}
            {id && !view && (
              <p className="text-sm text-muted-foreground">
                {error
                  ? "This campaign could not be loaded. Choose a campaign or try refreshing."
                  : "Opening campaign…"}
              </p>
            )}
            {view && props && (
              <div
                className="space-y-6"
                onChangeCapture={() => {
                  if (draftRevision === null) setDraftRevision(view.revision);
                }}
              >
                <div>
                  <div className="flex flex-wrap justify-between gap-3">
                    <h2 className="text-3xl font-semibold">{view.name}</h2>
                    <span className="text-sm text-muted-foreground">
                      {view.isGM ? "GM workspace" : "Party workspace"}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                    {view.state.description}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {lastRead
                      ? `Checked ${lastRead.toLocaleTimeString()} · Updates every 15 seconds and when you return`
                      : "Connecting…"}
                  </p>
                </div>
                <nav
                  aria-label="Campaign sections"
                  className="flex gap-2 overflow-x-auto border-b pb-3"
                >
                  {tabs
                    .filter((t) => t !== "Settings" || view.isGM)
                    .map((t) => (
                      <Button
                        key={t}
                        variant={tab === t ? "default" : "ghost"}
                        aria-current={tab === t ? "page" : undefined}
                        onClick={() => {
                          setTab(t);
                          setDraftRevision(null);
                        }}
                      >
                        {t}
                      </Button>
                    ))}
                </nav>
                {draftRevision !== null && draftRevision !== view.revision && (
                  <div role="alert" className="rounded-lg border border-amber-500 p-4 space-y-3">
                    <p className="text-sm">
                      The campaign changed while you were editing. Your draft is kept. Review the
                      latest information before saving it.
                    </p>
                    <Button variant="outline" onClick={() => setDraftRevision(view.revision)}>
                      Use latest version for this draft
                    </Button>
                  </div>
                )}
                {tab === "Party" && <Party {...props} characters={characters} sync={sync} />}
                {tab === "Inventory" && <Inventory {...props} characters={characters} />}
                {tab === "Journal" && <Journal {...props} />}
                {tab === "Encounters" && <Encounters {...props} />}
                {tab === "Sessions" && <Sessions {...props} />}
                {tab === "Activity" && (
                  <Panel title="Recent activity">
                    <p className="text-xs text-muted-foreground">
                      Showing the latest 500 recorded changes you can see.
                    </p>
                    {view.state.activity
                      .slice()
                      .reverse()
                      .map((a) => (
                        <div key={a.id} className="border-b pb-3 text-sm">
                          <p>
                            <strong>{a.actor}</strong> · {a.message}
                            {a.gmOnly ? " · GM only" : ""}
                          </p>
                          <time className="text-xs text-muted-foreground">
                            {new Date(a.at).toLocaleString()}
                          </time>
                        </div>
                      ))}
                  </Panel>
                )}
                {tab === "Settings" && view.isGM && (
                  <div className="space-y-6">
                    <Panel title="Invite your party">
                      <p className="text-sm">
                        New links last seven days and admit up to ten people. Only share links with
                        your players.
                      </p>
                      <Button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            const result = await campaignService.invite(view.id, view.revision);
                            setInviteLink(
                              `${window.location.origin}/campaigns/?invite=${encodeURIComponent(result.token)}`,
                            );
                            await refresh();
                          })
                        }
                      >
                        Create invitation
                      </Button>
                      {inviteLink && (
                        <Field label="New invitation link">
                          <input
                            className={inputClass}
                            value={inviteLink}
                            readOnly
                            onFocus={(e) => e.target.select()}
                          />
                        </Field>
                      )}
                      {view.invites.map((i) => (
                        <div key={i.id} className="flex flex-wrap gap-3 items-center text-sm">
                          <span>
                            {i.revoked
                              ? "Revoked"
                              : new Date(i.expiresAt) < new Date()
                                ? "Expired"
                                : "Active"}{" "}
                            · {i.uses}/{i.maxUses} joined · Expires{" "}
                            {new Date(i.expiresAt).toLocaleDateString()}
                          </span>
                          {!i.revoked && (
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  await campaignService.revoke(view.id, i.id);
                                  setInviteLink("");
                                  await refresh();
                                })
                              }
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      ))}
                    </Panel>
                    <Panel title="Campaign details">
                      <form
                        className="grid gap-4"
                        onSubmit={async (e) => {
                          const d = formValues(e);
                          await command({
                            type: "settings",
                            name: string(d, "name"),
                            description: string(d, "description"),
                          });
                        }}
                      >
                        <Field label="Name">
                          <input
                            className={inputClass}
                            name="name"
                            defaultValue={view.name}
                            required
                            maxLength={120}
                          />
                        </Field>
                        <Field label="Description">
                          <textarea
                            className={inputClass}
                            name="description"
                            defaultValue={view.state.description}
                            maxLength={10000}
                            rows={4}
                          />
                        </Field>
                        <Button disabled={busy}>Save details</Button>
                      </form>
                    </Panel>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
