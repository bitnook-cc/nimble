import { AncestryDefinition } from '../../types/ancestry';

export const oozeling: AncestryDefinition = {
  id: 'oozeling',
  name: 'Oozeling/Construct',
  description: "What even is a \"PeOpLe\" anyway? So what if your heart pumps oil instead of blood, so what if you don't even have a heart!? If you can squish yourself into a pair of pants, or swing a sword like everyone else, who's to say you can't be a pEOpLe, too?!",
  size: 'small',
  rarity: 'exotic',
  features: [
    {
      type: 'passive_feature',
      name: 'Odd Constitution',
      description: 'Increment your Hit Dice one step (d6 » d8 » d10 » d12 » d20); they always heal you for the maximum amount. Magical healing always heals you for the minimum amount.'
    }
  ]
};