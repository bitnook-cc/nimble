import { AncestryDefinition } from '../../types/ancestry';
import { gnomeNames } from '../name-configs';

export const gnome: AncestryDefinition = {
  id: 'gnome',
  name: 'Gnome',
  description: 'Eccentric, curious, and perpetually optimistic, gnomes are cheerful—especially when compared to their typically grumpier and larger kin, the dwarves. Known for their tinkering, spreading cheer, and playful antics, gnomes pursue their passions with a scatterbrained enthusiasm.',
  size: 'small',
  rarity: 'common',
  features: [
    {
      type: 'passive_feature',
      name: 'Optimistic',
      description: 'Allow an ally within Reach 6 to reroll any single die, resets when healed to your max HP. -1 Speed. You know Dwarvish if your INT is not negative (but you call it Gnomish, of course).',
    }
  ],
  nameConfig: gnomeNames
};