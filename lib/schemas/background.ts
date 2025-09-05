import { z } from 'zod';
import { FeatureEffectSchema } from './feature-effects';

// Background Feature Schema - now uses effects array
export const BackgroundFeatureSchema = z.object({
  id: z.string().min(1).meta({ title: 'ID', description: 'Unique identifier for the feature' }),
  name: z.string().min(1).meta({ title: 'Name', description: 'Feature name' }),
  description: z.string().min(1).meta({ title: 'Description', description: 'Feature description' }),
  effects: z.array(FeatureEffectSchema).meta({ title: 'Effects', description: 'Array of effects this feature provides' })
}).meta({ title: 'Background Feature', description: 'A feature that provides effects to characters from their background' });

export const BackgroundDefinitionSchema = z.object({
  id: z.string().min(1).meta({ title: 'ID', description: 'Unique identifier for the background' }),
  name: z.string().min(1).meta({ title: 'Name', description: 'Display name of the background' }),
  description: z.string().min(1).meta({ title: 'Description', description: 'Detailed description of the background' }),
  features: z.array(BackgroundFeatureSchema).meta({ title: 'Features', description: 'All features provided by this background' })
}).meta({ title: 'Background Definition', description: 'Character background definition with features and traits' });

export const BackgroundTraitSchema = z.object({
  backgroundId: z.string().min(1).meta({ title: 'Background ID', description: 'ID of the character\'s background' }),
  grantedFeatures: z.array(z.string()).meta({ title: 'Granted Features', description: 'IDs of background features already granted' })
}).meta({ title: 'Background Trait', description: 'Character background reference' });

// Export individual schemas for specific use cases
export {}