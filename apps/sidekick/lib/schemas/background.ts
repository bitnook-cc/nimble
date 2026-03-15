import { z } from "zod";

import { CharacterFeatureSchema } from "./features";

export const BackgroundDefinitionSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .meta({ title: "ID", description: "Unique identifier for the background" }),
    name: z.string().min(1).meta({ title: "Name", description: "Display name of the background" }),
    description: z
      .string()
      .min(1)
      .meta({ title: "Description", description: "Detailed description of the background" }),
    features: z
      .array(CharacterFeatureSchema)
      .meta({ title: "Features", description: "All features provided by this background" }),
  })
  .meta({
    title: "Background Definition",
    description: "Character background definition with features and traits",
  });

// Export inferred types
export type BackgroundDefinition = z.infer<typeof BackgroundDefinitionSchema>;
