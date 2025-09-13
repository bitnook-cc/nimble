import { BackgroundDefinition } from "../../schemas/background";

export const atHomeUnderground: BackgroundDefinition = {
  id: "at-home-underground",
  name: "At Home Underground",
  description:
    'You can dig twice as fast as others. Safe resting locations underground always count as Lavish lodging for you. You struggle to rest (INT save) while it\'s raining. "Water... from the SKY?!"',
  features: [
    {
      id: "at-home-underground-expert-digger",
      name: "Expert Digger",
      description: "You can dig twice as fast as others.",
      traits: [], // Passive feature - no mechanical traits to process
    },
    {
      id: "at-home-underground-underground-comfort",
      name: "Underground Comfort",
      description: "Safe resting locations underground always count as Lavish lodging for you.",
      traits: [], // Passive feature - no mechanical traits to process
    },
    {
      id: "at-home-underground-rain-aversion",
      name: "Rain Aversion",
      description: 'You struggle to rest (INT save) while it\'s raining. "Water... from the SKY?!"',
      traits: [], // Passive feature - no mechanical traits to process
    },
  ],
};
