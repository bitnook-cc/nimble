import { choose, type RandomSource } from "./name-generator.js";

export const npcAttributeKinds = [
  "appearance",
  "scar",
  "mannerism",
  "quirk",
] as const;
export type NpcAttributeKind = (typeof npcAttributeKinds)[number];
export type NpcAttributes = Record<NpcAttributeKind, string>;
export type NpcAttributeTables = Readonly<
  Record<NpcAttributeKind, readonly string[]>
>;
export const npcAttributeLabels: Record<NpcAttributeKind, string> = {
  appearance: "Appearance",
  scar: "Scar or mark",
  mannerism: "Mannerism",
  quirk: "Quirk",
};

// Original, system-neutral roleplaying prompts; no mechanical attribute scores.
export const npcAttributeTables: NpcAttributeTables = {
  appearance: [
    "A silver streak runs through their hair.",
    "Their coat is covered in careful, colourful repairs.",
    "They wear several mismatched rings.",
    "Their sleeves are always rolled up, even in the cold.",
    "A wide-brimmed hat hides most of their face.",
    "Their fingertips are stained with ink.",
    "Their boots are polished far better than the rest of their clothes.",
    "They carry a walking stick carved with tiny birds.",
    "Their hair is braided with copper wire.",
    "A bright scarf is tied around one wrist.",
    "They wear an apron with far too many pockets.",
    "A single earring looks like a tiny key.",
    "Their clothes smell faintly of woodsmoke.",
    "They wear a faded ribbon pinned to their collar.",
    "Their spectacles are held together with thread.",
    "They have a neatly waxed moustache.",
    "Their cloak is embroidered with a map of unfamiliar stars.",
    "Their belt carries a collection of small leather pouches.",
    "They always have fresh flowers tucked into a buttonhole.",
    "Their nails are meticulously painted.",
    "Their hands are dusted with flour.",
    "Their hair is cut unevenly, as if done in a hurry.",
    "They wear a conspicuously fine coat over work clothes.",
    "Their expression seems permanently amused.",
  ],
  scar: [
    "A pale scar cuts through one eyebrow.",
    "An old burn curls across the back of one hand.",
    "A small crescent scar marks their chin.",
    "A faint scar runs from ear to jaw.",
    "One knuckle bears a badly faded tattoo.",
    "A thin white line crosses their lower lip.",
    "A ladder of little scars marks one forearm.",
    "Their nose healed slightly crooked.",
    "An old bite mark circles one wrist.",
    "A star-shaped birthmark shows at their temple.",
    "A puckered scar is half-hidden beneath their collar.",
    "A childhood scrape left a pale patch on one knee.",
    "A small notch interrupts the edge of one ear.",
    "A tattoo of a broken crown has been crossed out.",
    "Their palms bear the rough marks of years of rope work.",
    "A splash-shaped burn marks one shoulder.",
    "One cheek has a tiny scar shaped like a comma.",
    "An old frostbite mark darkens two fingertips.",
    "A faded tattoo of a ship peeks from their sleeve.",
    "A pale patch of hair grows above an old scalp scar.",
    "A healed cut crosses their palm.",
    "A ring-shaped birthmark circles one ankle.",
    "A faint scar disappears beneath their hairline.",
    "They have no obvious scars or distinguishing marks.",
  ],
  mannerism: [
    "They tap a finger against their teeth while thinking.",
    "They straighten nearby objects as they talk.",
    "They lower their voice whenever they use a person's name.",
    "They rub a thumb over an old coin in their pocket.",
    "They pause to choose each word with great care.",
    "They answer questions with a slight tilt of the head.",
    "They punctuate sentences with a small whistle.",
    "They make elaborate gestures with both hands.",
    "They repeat the last few words of a question before answering.",
    "They glance at the nearest exit whenever a door opens.",
    "They rock gently on their heels when waiting.",
    "They sketch shapes in the air while explaining things.",
    "They laugh quietly before delivering bad news.",
    "They hum a few notes whenever a conversation stalls.",
    "They fold and unfold the corner of a handkerchief.",
    "They address everyone by a formal title.",
    "They lean in as though every conversation is a secret.",
    "They count points off on their fingers.",
    "They drum a rhythm on the table before making a decision.",
    "They finish speaking with a little nod to themselves.",
    "They blink slowly before disagreeing.",
    "They adjust their cuffs whenever they feel uncertain.",
    "They hold eye contact until the other person looks away.",
    "They trace the rim of their cup while listening.",
  ],
  quirk: [
    "They collect keys that no longer open anything.",
    "They insist every animal understands polite conversation.",
    "They refuse to step on cracks in paving stones.",
    "They give nicknames to all their tools.",
    "They are convinced a particular number brings luck.",
    "They remember every meal they have eaten this week.",
    "They will trade almost anything for a new local proverb.",
    "They invent a new origin story for their scar each time they are asked.",
    "They keep a list of people who have made them laugh.",
    "They never travel without a favourite teacup.",
    "They apologise to doors when they bump into them.",
    "They are secretly learning to juggle.",
    "They believe any bargain should end with a shared snack.",
    "They judge inns by the quality of their door hinges.",
    "They send letters to themselves to test the local post.",
    "They always carry a spare invitation to an imaginary party.",
    "They keep trying to rhyme ordinary conversation.",
    "They know obscure facts about mushrooms and little else.",
    "They consider a losing wager a valuable story.",
    "They have a strong opinion about the proper shape of a spoon.",
    "They rescue interesting buttons from discarded clothing.",
    "They insist on being the last person to say goodbye.",
    "They leave tiny carved tokens as thanks for kindness.",
    "They try to learn the name of every bridge they cross.",
  ],
};

export function generateNpcAttribute(
  kind: NpcAttributeKind,
  random: RandomSource = Math.random,
  tables: NpcAttributeTables = npcAttributeTables,
): string {
  return choose(tables[kind], random);
}
export function generateNpcAttributes(
  random: RandomSource = Math.random,
  tables: NpcAttributeTables = npcAttributeTables,
): NpcAttributes {
  return Object.fromEntries(
    npcAttributeKinds.map((kind) => [
      kind,
      generateNpcAttribute(kind, random, tables),
    ]),
  ) as NpcAttributes;
}
