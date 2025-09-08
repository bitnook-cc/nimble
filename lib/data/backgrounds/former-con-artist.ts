import { BackgroundDefinition } from "../../schemas/background";

export const formerConArtist: BackgroundDefinition = {
  id: "former-con-artist",
  name: "(Former) Con Artist",
  description:
    "You can forge most documents or mimic voices flawlessly. You have a criminal contact in most major cities. However, your reputation often precedes you—until you prove yourself to be trustworthy.",
  features: [
    {
      id: "former-con-artist-master-forger",
      name: "Master Forger",
      description: "You can forge most documents or mimic voices flawlessly.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "former-con-artist-criminal-network",
      name: "Criminal Network",
      description: "You have a criminal contact in most major cities.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "former-con-artist-questionable-reputation",
      name: "Questionable Reputation",
      description: "Your reputation often precedes you—until you prove yourself to be trustworthy.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
};
