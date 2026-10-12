import { campaigns } from "@nimble/shared";
import Pusher from "pusher-js";

import { apiFetch } from "../utils/api";

export class CampaignRequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await apiFetch(`/campaigns${path}`, {
    method,
    credentials: "include",
    cache: "no-store",
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new CampaignRequestError(response.status, data.error || "Campaign could not be updated.");
  return data;
}
class CampaignService {
  list = () => request<campaigns.CampaignSummary[]>("");
  view = (id: string) => request<campaigns.CampaignView>(`/${encodeURIComponent(id)}`);
  create = (name: string, description: string) =>
    request<{ id: string }>("", "POST", { name, description });
  join = (token: string) => request<{ id: string }>("/join", "POST", { token });
  invite = (id: string, expectedRevision: number) =>
    request<{ token: string }>(`/${id}/invites`, "POST", {
      days: 7,
      maxUses: 10,
      expectedRevision,
    });
  revoke = (id: string, inviteId: string) => request(`/${id}/invites/${inviteId}`, "DELETE");
  // The caller keeps this operation ID across retries after an uncertain network result.
  mutate = (id: string, mutation: campaigns.Mutation) =>
    request<{ revision: number }>(`/${id}/commands`, "POST", mutation);
  subscribe(id: string, userId: string, refresh: () => void) {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return () => {};
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
      channelAuthorization: {
        customHandler: async ({ socketId, channelName }, callback) => {
          try {
            const auth = await request<{ auth: string }>("/pusher/auth", "POST", {
              campaignId: id,
              socket_id: socketId,
              channel_name: channelName,
            });
            callback(null, auth);
          } catch (error) {
            callback(error as Error, null);
          }
        },
      },
    });
    pusher.subscribe(campaigns.channelName(id, userId)).bind("campaign-updated", refresh);
    return () => pusher.disconnect();
  }
}
export const campaignService = new CampaignService();
