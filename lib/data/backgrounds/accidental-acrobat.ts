import { BackgroundDefinition } from "../../types/background";

export const accidentalAcrobat: BackgroundDefinition = {
  id: "accidental-acrobat",
  name: "Accidental Acrobat",
  description:
    "(Req. 0 or negative DEX at character creation.) Whenever you fail a DEX-related roll (e.g., DEX attack, DEX save, Stealth check, Finesse check), you may roll again. If you still fail, the consequences are BAD.",
  features: [
    {
      id: "accidental-acrobat-lucky-clumsiness",
      name: "Lucky Clumsiness",
      description:
        "Whenever you fail a DEX-related roll (e.g., DEX attack, DEX save, Stealth check, Finesse check), you may roll again. If you still fail, the consequences are BAD.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
};
