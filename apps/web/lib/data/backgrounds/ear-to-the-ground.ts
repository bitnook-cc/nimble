import { BackgroundDefinition } from "../../schemas/background";

export const earToTheGround: BackgroundDefinition = {
  id: "ear-to-the-ground",
  name: "Ear to the Ground",
  description:
    "Advantage on checks to know or obtain gossip for events that will soon happen or have happened less than 1 year ago.",
  features: [
    {
      id: "ear-to-the-ground-information-network",
      name: "Information Network",
      description:
        "Advantage on checks to know or obtain gossip for events that will soon happen or have happened less than 1 year ago.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
};
