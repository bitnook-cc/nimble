import { createHash, randomBytes } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { characterInventory } from "@nimble/shared";
const { inventorySchema } = characterInventory;
import { campaigns } from "@nimble/shared";
import {
  applyCampaignCommand,
  characterView,
  publicState,
  requireCampaign,
  transferItem,
} from "./campaign-engine.js";

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
type Tx = Prisma.TransactionClient;

export class CampaignService {
  constructor(private prisma: PrismaClient) {}

  private async access(tx: Tx, id: string, userId: string) {
    await tx.$queryRaw`SELECT id FROM "Campaign" WHERE id = ${id} FOR UPDATE`;
    const campaign = await tx.campaign.findUnique({
      where: { id },
      include: { members: { include: { user: { select: { name: true } } } } },
    });
    const member = campaign?.members.find((m) => m.userId === userId);
    requireCampaign(
      campaign && member,
      404,
      "Campaign not found or access has ended.",
    );
    return {
      campaign,
      member,
      isGM: campaign.ownerId === userId || member.role === "GM",
    };
  }

  async list(userId: string): Promise<campaigns.CampaignSummary[]> {
    const entries = await this.prisma.campaignMember.findMany({
      where: { userId },
      include: {
        campaign: { select: { id: true, name: true, revision: true } },
      },
      orderBy: { joinedAt: "desc" },
    });
    return entries.map((m) => ({ ...m.campaign, role: m.role }));
  }

  async create(userId: string, input: unknown) {
    const data = campaigns.createSchema.parse(input);
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      requireCampaign(
        (await tx.campaign.count({ where: { ownerId: userId } })) < 20,
        400,
        "You can own up to 20 campaigns.",
      );
      const state = campaigns.emptyState();
      state.description = data.description;
      return tx.campaign.create({
        data: {
          name: data.name,
          ownerId: userId,
          state: json(state),
          members: { create: { userId, role: "GM" } },
        },
        select: { id: true },
      });
    });
  }

  async view(id: string, userId: string): Promise<campaigns.CampaignView> {
    return this.prisma.$transaction(async (tx) => {
      const { campaign, isGM } = await this.access(tx, id, userId);
      const attached = campaign.members.filter((m) => m.characterId);
      const backups = attached.length
        ? await tx.characterBackup.findMany({
            where: {
              OR: attached.map((m) => ({
                userId: m.userId,
                characterId: m.characterId!,
              })),
            },
          })
        : [];
      const members: campaigns.MemberView[] = campaign.members.map((m) => {
        const backup = backups.find(
          (b) => b.userId === m.userId && b.characterId === m.characterId,
        );
        return {
          userId: m.userId,
          name: m.user.name,
          role: m.role === "GM" ? "GM" : "PLAYER",
          characterId: m.characterId,
          shareNotes: m.shareNotes,
          syncedAt: backup?.syncedAt.toISOString() ?? null,
          inventoryRevision: backup?.inventoryRevision ?? 0,
          character: backup
            ? characterView(
                backup.characterData as Record<string, unknown>,
                isGM || m.userId === userId,
                m.userId === userId || m.shareNotes,
              )
            : null,
        };
      });
      const invites = isGM
        ? await tx.campaignInvite.findMany({
            where: { campaignId: id },
            select: {
              id: true,
              expiresAt: true,
              uses: true,
              maxUses: true,
              revoked: true,
            },
            orderBy: { expiresAt: "desc" },
            take: 30,
          })
        : [];
      return {
        id,
        name: campaign.name,
        ownerId: campaign.ownerId,
        revision: campaign.revision,
        isGM,
        members,
        state: publicState(campaigns.stateSchema.parse(campaign.state), isGM),
        invites: invites.map((i) => ({
          ...i,
          expiresAt: i.expiresAt.toISOString(),
        })),
      };
    });
  }

  async members(id: string) {
    return this.prisma.campaignMember.findMany({
      where: { campaignId: id },
      select: { userId: true },
    });
  }
  async authorize(id: string, userId: string) {
    return this.prisma.$transaction((tx) =>
      this.access(tx, id, userId).then(() => true),
    );
  }

  async invite(id: string, userId: string, input: unknown) {
    const data = campaigns.inviteSchema.parse(input);
    const token = randomBytes(32).toString("base64url");
    await this.prisma.$transaction(async (tx) => {
      const { campaign, isGM } = await this.access(tx, id, userId);
      requireCampaign(isGM, 403, "Only a GM can invite players.");
      requireCampaign(
        campaign.revision === data.expectedRevision,
        409,
        "Campaign changed. Refresh and try again.",
      );
      requireCampaign(
        (await tx.campaignInvite.count({
          where: {
            campaignId: id,
            revoked: false,
            expiresAt: { gt: new Date() },
          },
        })) < 20,
        400,
        "Revoke an unused invite before creating another.",
      );
      await tx.campaignInvite.create({
        data: {
          campaignId: id,
          tokenHash: hash(token),
          expiresAt: new Date(Date.now() + data.days * 86400000),
          maxUses: data.maxUses,
        },
      });
      await tx.campaign.update({
        where: { id },
        data: { revision: { increment: 1 } },
      });
    });
    return { token };
  }

  async revoke(id: string, userId: string, inviteId: string) {
    await this.prisma.$transaction(async (tx) => {
      const { isGM } = await this.access(tx, id, userId);
      requireCampaign(isGM, 403, "Only a GM can revoke invites.");
      await tx.campaignInvite.updateMany({
        where: { id: inviteId, campaignId: id },
        data: { revoked: true },
      });
      await tx.campaign.update({
        where: { id },
        data: { revision: { increment: 1 } },
      });
    });
  }

  async join(userId: string, token: unknown) {
    requireCampaign(
      typeof token === "string" && /^[\w-]{43}$/.test(token),
      400,
      "Invalid invite link.",
    );
    const invite = await this.prisma.campaignInvite.findUnique({
      where: { tokenHash: hash(token) },
    });
    requireCampaign(invite, 404, "Invite not found.");
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Campaign" WHERE id = ${invite.campaignId} FOR UPDATE`;
      const current = await tx.campaignInvite.findUnique({
        where: { id: invite.id },
      });
      requireCampaign(
        current &&
          !current.revoked &&
          current.expiresAt > new Date() &&
          current.uses < current.maxUses,
        410,
        "This invite has expired or been used up. Ask your GM for a new link.",
      );
      const existing = await tx.campaignMember.findUnique({
        where: { campaignId_userId: { campaignId: invite.campaignId, userId } },
      });
      if (!existing) {
        requireCampaign(
          (await tx.campaignMember.count({
            where: { campaignId: invite.campaignId },
          })) < 20,
          400,
          "This campaign has reached its 20 member limit.",
        );
        await tx.campaignMember.create({
          data: { campaignId: invite.campaignId, userId },
        });
        await tx.campaignInvite.update({
          where: { id: invite.id },
          data: { uses: { increment: 1 } },
        });
        await tx.campaign.update({
          where: { id: invite.campaignId },
          data: { revision: { increment: 1 } },
        });
      }
      return { id: invite.campaignId };
    });
  }

  async mutate(id: string, userId: string, input: unknown) {
    const { command, operationId, expectedRevision } =
      campaigns.mutationSchema.parse(input);
    const requestHash = hash(JSON.stringify(command));
    return this.prisma.$transaction(
      async (tx) => {
        // All transfers and syncs lock the character account before the campaign.
        const target =
          command.type === "transfer" || command.type === "currency"
            ? command.userId
            : userId;
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${target} FOR UPDATE`;
        const { campaign, member, isGM } = await this.access(tx, id, userId);
        const prior = await tx.campaignOperation.findUnique({
          where: { campaignId_id: { campaignId: id, id: operationId } },
        });
        if (prior) {
          requireCampaign(
            prior.userId === userId && prior.requestHash === requestHash,
            409,
            "This operation was already used for a different change.",
          );
          return { revision: campaign.revision };
        }
        requireCampaign(
          campaign.revision === expectedRevision,
          409,
          "Someone updated the campaign. Your form is kept; review the latest version and try again.",
        );
        const state = campaigns.stateSchema.parse(campaign.state);
        let gmOnly = false;
        let message = "Updated the campaign";
        if (command.type === "attach") {
          if (command.characterId)
            requireCampaign(
              await tx.characterBackup.findUnique({
                where: {
                  userId_characterId: {
                    userId,
                    characterId: command.characterId,
                  },
                },
              }),
              400,
              "Sync your character before adding it to a campaign.",
            );
          await tx.campaignMember.update({
            where: { campaignId_userId: { campaignId: id, userId } },
            data: {
              characterId: command.characterId,
              shareNotes: command.shareNotes,
            },
          });
          message = command.characterId
            ? "Updated their shared character"
            : "Detached their character";
        } else if (command.type === "member") {
          requireCampaign(
            command.userId !== campaign.ownerId,
            403,
            "The campaign owner cannot be removed or demoted.",
          );
          const other = campaign.members.find(
            (m) => m.userId === command.userId,
          );
          requireCampaign(other, 404, "Member not found.");
          const leaving =
            command.userId === userId && command.action === "remove";
          requireCampaign(
            leaving ||
              (command.action === "remove" && isGM && other.role !== "GM") ||
              campaign.ownerId === userId,
            403,
            "Only the owner can change GM access.",
          );
          if (command.action === "remove")
            await tx.campaignMember.delete({
              where: {
                campaignId_userId: { campaignId: id, userId: command.userId },
              },
            });
          else
            await tx.campaignMember.update({
              where: {
                campaignId_userId: { campaignId: id, userId: command.userId },
              },
              data: { role: command.action },
            });
          message =
            command.action === "remove"
              ? `${other.user.name} left the campaign`
              : `${other.user.name}'s role changed`;
        } else if (command.type === "transfer" || command.type === "currency") {
          requireCampaign(
            isGM || command.userId === userId,
            403,
            "You can only transfer items for your own character.",
          );
          if (command.direction === "deposit")
            requireCampaign(
              command.userId === userId,
              403,
              "Only the owner can deposit from a character.",
            );
          if (command.type === "currency" && command.direction === "award") {
            requireCampaign(isGM, 403, "Only a GM can add treasure.");
            state.treasury[command.currency] += command.amount;
            message = `Added ${command.amount} ${command.currency} to the party treasury`;
          } else {
            const targetMember = campaign.members.find(
              (m) => m.userId === target,
            );
            requireCampaign(
              targetMember?.characterId,
              400,
              "Choose a member with a synced character.",
            );
            const backup = await tx.characterBackup.findUnique({
              where: {
                userId_characterId: {
                  userId: target,
                  characterId: targetMember.characterId,
                },
              },
            });
            requireCampaign(
              backup && backup.inventoryRevision === command.inventoryRevision,
              409,
              "Character inventory changed. Review the latest inventory first.",
            );
            const character = structuredClone(backup.characterData) as Record<
              string,
              unknown
            >;
            const parsedInventory = inventorySchema.safeParse(
              character.inventory,
            );
            requireCampaign(
              parsedInventory.success,
              400,
              "This character inventory needs repair in Sidekick first.",
            );
            const inventory = parsedInventory.data;
            character.inventory = inventory;
            requireCampaign(
              inventory && Array.isArray(inventory.items) && inventory.currency,
              400,
              "This character's inventory needs repair in Sidekick first.",
            );
            if (command.type === "transfer") {
              const entry = state.items.find((i) => i.id === command.itemId);
              requireCampaign(
                command.direction !== "claim" ||
                  (entry && (!entry.hidden || isGM)),
                404,
                "Item not found.",
              );
              const itemName =
                command.direction === "deposit"
                  ? inventory.items.find((i) => i.id === command.itemId)?.name
                  : entry?.item.name;
              transferItem(state, inventory, command);
              message = `${command.direction === "deposit" ? "Deposited" : "Claimed"} ${command.quantity} × ${itemName} (${targetMember.user.name})`;
              gmOnly = !!entry?.hidden;
            } else {
              const amount = inventory.currency[command.currency] ?? 0;
              requireCampaign(
                Number.isSafeInteger(amount) && amount >= 0,
                400,
                "Character currency must be a nonnegative whole number.",
              );
              if (command.direction === "deposit") {
                requireCampaign(
                  amount >= command.amount,
                  409,
                  "Character has insufficient currency.",
                );
                inventory.currency[command.currency] = amount - command.amount;
                state.treasury[command.currency] += command.amount;
              } else {
                requireCampaign(
                  state.treasury[command.currency] >= command.amount,
                  409,
                  "Party has insufficient currency.",
                );
                state.treasury[command.currency] -= command.amount;
                inventory.currency[command.currency] = amount + command.amount;
              }
              message = `${command.direction === "deposit" ? "Deposited" : "Claimed"} ${command.amount} ${command.currency} (${targetMember.user.name})`;
            }
            character._inventoryRevision = backup.inventoryRevision + 1;
            character.timestamps = {
              ...(character.timestamps as object),
              updatedAt: Math.max(Date.now(), backup.updatedAt.getTime() + 1),
            };
            await tx.characterBackup.update({
              where: { id: backup.id },
              data: {
                characterData: json(character),
                inventoryRevision: { increment: 1 },
                updatedAt: new Date(
                  (character.timestamps as { updatedAt: number }).updatedAt,
                ),
              },
            });
          }
        } else {
          requireCampaign(isGM, 403, "Only a GM can make this change.");
          applyCampaignCommand(state, command);
          gmOnly =
            ["monster", "encounter", "stash", "delete"].includes(
              command.type,
            ) ||
            (command.type === "journal" && command.entry.visibility === "gm");
          message = (
            {
              settings: "Updated campaign details",
              stash: "Updated party supplies",
              journal: "Updated the journal",
              session: "Updated a session",
              monster: "Updated the monster library",
              encounter: "Updated an encounter plan",
              delete: "Removed an entry",
              start: "Started an encounter",
              round: "Advanced the round",
              finish: "Finished an encounter",
              combatant: "Updated the encounter",
            } as Record<string, string>
          )[command.type];
        }
        state.activity.push({
          id: operationId,
          at: new Date().toISOString(),
          actor: member.user.name,
          message,
          gmOnly,
        });
        state.activity = state.activity.slice(-500);
        const valid = campaigns.stateSchema.safeParse(state);
        requireCampaign(
          valid.success && JSON.stringify(state).length <= 2000000,
          400,
          "Campaign storage limit reached or invalid data. Remove unused entries and try again.",
        );
        await tx.campaign.update({
          where: { id },
          data: {
            state: json(state),
            revision: { increment: 1 },
            ...(command.type === "settings" ? { name: command.name } : {}),
          },
        });
        await tx.campaignOperation.create({
          data: { campaignId: id, id: operationId, userId, requestHash },
        });
        return { revision: campaign.revision + 1 };
      },
      { timeout: 15000 },
    );
  }
}
