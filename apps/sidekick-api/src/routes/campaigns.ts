import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { campaigns } from "@nimble/shared";
import { AuthService } from "../services/auth-service.js";
import { CampaignService } from "../services/campaign-service.js";
import { CampaignError } from "../services/campaign-engine.js";
import { pusher } from "../lib/pusher.js";

const prisma = new PrismaClient();
const service = new CampaignService(prisma);
const auth = new AuthService(prisma);
const router = Router();
router.use(async (req, res, next) => {
  try {
    const user = await auth.ensureUserExists(req.session);
    if (!user) {
      res.status(401).json({ error: "Sign in to open campaigns." });
      return;
    }
    res.setHeader("Cache-Control", "private, no-store");
    next();
  } catch (error) {
    next(error);
  }
});
const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res).catch(next);
  };
async function notify(id: string) {
  if (
    !process.env.PUSHER_APP_ID ||
    !process.env.PUSHER_KEY ||
    !process.env.PUSHER_SECRET
  )
    return;
  try {
    const members = await service.members(id);
    // Only invalidation is broadcast; each new read rechecks access and visibility.
    await Promise.all(
      members.map((m) =>
        pusher.trigger(
          campaigns.channelName(id, m.userId),
          "campaign-updated",
          {},
        ),
      ),
    );
  } catch {
    /* Polling recovers missed notifications. A committed write still succeeds. */
  }
}
router.get(
  "/",
  handle(async (req, res) =>
    res.json(await service.list(req.session.user!.id)),
  ),
);
router.post(
  "/",
  handle(async (req, res) =>
    res.status(201).json(await service.create(req.session.user!.id, req.body)),
  ),
);
router.post(
  "/join",
  handle(async (req, res) => {
    const result = await service.join(req.session.user!.id, req.body.token);
    await notify(result.id);
    res.json(result);
  }),
);
router.post(
  "/pusher/auth",
  handle(async (req, res) => {
    const { campaignId, channel_name, socket_id } = req.body;
    if (
      typeof campaignId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(campaignId) ||
      channel_name !==
        campaigns.channelName(campaignId, req.session.user!.id) ||
      typeof socket_id !== "string" ||
      !/^\d+\.\d+$/.test(socket_id)
    )
      throw new CampaignError(403, "Invalid channel.");
    await service.authorize(campaignId, req.session.user!.id);
    res.json(pusher.authorizeChannel(socket_id, channel_name));
  }),
);
router.get(
  "/:id",
  handle(async (req, res) =>
    res.json(await service.view(req.params.id as string, req.session.user!.id)),
  ),
);
router.post(
  "/:id/invites",
  handle(async (req, res) => {
    const id = req.params.id as string;
    const result = await service.invite(id, req.session.user!.id, req.body);
    await notify(id);
    res.status(201).json(result);
  }),
);
router.delete(
  "/:id/invites/:inviteId",
  handle(async (req, res) => {
    const id = req.params.id as string;
    await service.revoke(
      id,
      req.session.user!.id,
      req.params.inviteId as string,
    );
    await notify(id);
    res.json({ success: true });
  }),
);
router.post(
  "/:id/commands",
  handle(async (req, res) => {
    if (JSON.stringify(req.body).length > 256000)
      throw new CampaignError(413, "This entry is too large.");
    const id = req.params.id as string;
    const result = await service.mutate(id, req.session.user!.id, req.body);
    await notify(id);
    res.json(result);
  }),
);
router.use((error: Error, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof CampaignError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error.name === "ZodError") {
    res
      .status(400)
      .json({ error: "Check the form fields and limits, then try again." });
    return;
  }
  next(error);
});
export default router;
