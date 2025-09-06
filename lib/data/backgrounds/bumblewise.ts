import { BackgroundDefinition } from "../../types/background";

export const bumblewise: BackgroundDefinition = {
  id: "bumblewise",
  name: "Bumblewise",
  description:
    "(Req. 0 or negative WIL at character creation.) A result of 1 or less on any WIL-related roll counts as a natural 20 (WIL save, Naturecraft, Perception, Influence, or Insight check).",
  features: [
    {
      id: "bumblewise-accidental-wisdom",
      name: "Accidental Wisdom",
      description:
        "A result of 1 or less on any WIL-related roll counts as a natural 20 (WIL save, Naturecraft, Perception, Influence, or Insight check).",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
};
