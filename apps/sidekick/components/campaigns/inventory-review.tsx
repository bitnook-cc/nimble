"use client";

import { Character } from "@/lib/schemas/character";

import { Button } from "../ui/button";
import { Panel, describe } from "./shared";

export type CloudInventory = {
  characterId: string;
  revision: number;
  inventory: Character["inventory"];
};
export function InventoryReview({
  local,
  cloud,
  busy,
  accept,
}: {
  local: Character;
  cloud: CloudInventory;
  busy: boolean;
  accept: () => Promise<void>;
}) {
  return (
    <Panel title={`Review ${local.name}'s party transfer`}>
      <p className="text-sm">
        A party transfer changed this character&apos;s cloud inventory. Your local copy is
        preserved. Accepting the cloud items and currency keeps all your other character edits.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <details>
          <summary className="cursor-pointer font-medium">On this device</summary>
          <p className="text-sm whitespace-pre-wrap break-words mt-2">
            {describe(local.inventory)}
          </p>
        </details>
        <details>
          <summary className="cursor-pointer font-medium">Cloud inventory</summary>
          <p className="text-sm whitespace-pre-wrap break-words mt-2">
            {describe(cloud.inventory)}
          </p>
        </details>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            const blob = new Blob(
              [
                JSON.stringify(
                  local,
                  (_k, value) => (value instanceof Map ? Object.fromEntries(value) : value),
                  2,
                ),
              ],
              { type: "application/json" },
            );
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "character-before-party-transfer.json";
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download local backup
        </Button>
        <Button disabled={busy} onClick={() => void accept()}>
          Accept cloud inventory
        </Button>
      </div>
    </Panel>
  );
}
