export type RandomSource = () => number;
export type NameGender = "male" | "female";
export interface NamePatterns {
  syllables: { prefixes: string[]; middle: string[]; suffixes: string[] };
  patterns: string[];
  constraints: {
    minLength: number;
    maxLength: number;
    syllableCount: { min: number; max: number };
  };
}
export interface NameConfig {
  male?: NamePatterns;
  female?: NamePatterns;
  unisex?: NamePatterns;
  surnames?: NamePatterns;
}

export function choose<T>(
  values: readonly T[],
  random: RandomSource = Math.random,
): T {
  if (!values.length) throw new Error("Cannot generate from an empty table.");
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new Error(
      "Random sources must return a number from 0 up to, but not including, 1.",
    );
  return values[Math.floor(value * values.length)];
}

function generateName(config: NamePatterns, random: RandomSource): string {
  const { minLength, maxLength, syllableCount } = config.constraints;
  if (
    ![minLength, maxLength, syllableCount.min, syllableCount.max].every(
      (n) => Number.isInteger(n) && n > 0,
    ) ||
    minLength > maxLength ||
    syllableCount.min > syllableCount.max
  )
    throw new Error("Invalid name constraints.");
  const fragments: Record<string, string[]> = {
    P: config.syllables.prefixes,
    M: config.syllables.middle,
    S: config.syllables.suffixes,
  };
  const patterns = config.patterns.filter(
    (pattern) =>
      /^[PMS]+$/.test(pattern) &&
      pattern.length >= syllableCount.min &&
      pattern.length <= syllableCount.max &&
      [...pattern].every(
        (part) =>
          fragments[part].length > 0 &&
          fragments[part].every((s) => s.length > 0),
      ),
  );
  if (!patterns.length)
    throw new Error("No usable name patterns match the syllable constraints.");
  const valid = (name: string) =>
    name.length >= minLength && name.length <= maxLength;
  const capitalise = (name: string) =>
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  for (let attempt = 0; attempt < 50; attempt++) {
    const pattern = choose(patterns, random);
    const name = [...pattern]
      .map((part) => choose(fragments[part], random))
      .join("");
    if (valid(name)) return capitalise(name);
  }
  // A fixed or unlucky random source still gets a valid fallback. Bound the
  // search so malformed custom tables cannot block the application indefinitely.
  let budget = 10000;
  const exhausted = new Set<string>();
  function search(pattern: string, name = ""): string | undefined {
    if (name.length > maxLength) return;
    // Constraints depend only on length. Avoid exploring identical failed
    // states again when weighted tables repeat fragments.
    const key = `${pattern}:${name.length}`;
    if (exhausted.has(key) || --budget < 0) return;
    if (!pattern) {
      if (valid(name)) return name;
      exhausted.add(key);
      return;
    }
    for (const fragment of fragments[pattern[0]]) {
      const found = search(pattern.slice(1), name + fragment);
      if (found) return found;
    }
    exhausted.add(key);
  }
  for (const pattern of patterns) {
    const fallback = search(pattern);
    if (fallback) return capitalise(fallback);
  }
  throw new Error(
    "The name table cannot produce a name within its constraints.",
  );
}

// Retains Sidekick's public API; the optional random source enables reproducible
// tables and tests without coupling the package to a browser or UI framework.
export class NameGenerator {
  static generateFirstName(
    config: NameConfig,
    gender?: NameGender,
    random: RandomSource = Math.random,
  ): string {
    if (config.unisex) return generateName(config.unisex, random);
    const requested = gender && config[gender];
    if (requested) return generateName(requested, random);
    const available = [config.male, config.female].filter(
      (c): c is NamePatterns => !!c,
    );
    if (!available.length)
      throw new Error("No valid name configuration found.");
    return generateName(choose(available, random), random);
  }
  static generateSurname(
    config: NameConfig,
    random: RandomSource = Math.random,
  ): string {
    if (!config.surnames) throw new Error("No surname configuration found.");
    return generateName(config.surnames, random);
  }
  static generateFullName(
    config: NameConfig,
    gender?: NameGender,
    random: RandomSource = Math.random,
  ): string {
    const first = this.generateFirstName(config, gender, random);
    return config.surnames
      ? `${first} ${this.generateSurname(config, random)}`
      : first;
  }
}
