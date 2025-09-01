import { AncestryNameConfig } from '../utils/name-generator'

// Generic fallback name config for ancestries without specific configs
export const genericNames: AncestryNameConfig = {
  male: {
    syllables: {
      prefixes: ['al', 'ar', 'bran', 'cor', 'dar', 'ed', 'gar', 'har', 'jon', 'mar', 'ric', 'rob', 'tha', 'wil', 'ae', 'cel', 'el', 'bor', 'dain', 'dur'],
      middle: ['an', 'en', 'in', 'on', 'ar', 'er', 'or', 'ic', 'rick', 'bert', 'win', 'fred', 'a', 'e', 'i', 'o'],
      suffixes: ['ard', 'bert', 'mund', 'win', 'fred', 'ric', 'ton', 'son', 'den', 'ley', 'dir', 'las', 'lon', 'mir']
    },
    patterns: ['PM', 'PS', 'PMS'],
    constraints: {
      minLength: 3,
      maxLength: 12,
      syllableCount: { min: 2, max: 3 }
    }
  },
  female: {
    syllables: {
      prefixes: ['al', 'an', 'bel', 'cat', 'el', 'ev', 'gwen', 'isa', 'mar', 'ros', 'sar', 'syl', 'vic', 'ar', 'cel', 'gil'],
      middle: ['a', 'e', 'i', 'an', 'en', 'in', 'ara', 'ela', 'ina', 'lyn', 'eth', 'o', 'ae', 'ai'],
      suffixes: ['a', 'e', 'ine', 'ara', 'ella', 'lyn', 'beth', 'wen', 'dra', 'lia', 'iel', 'wen', 'wyn', 'riel']
    },
    patterns: ['PM', 'PS', 'PMS'],
    constraints: {
      minLength: 3,
      maxLength: 12,
      syllableCount: { min: 2, max: 3 }
    }
  },
  surnames: {
    syllables: {
      prefixes: ['ash', 'black', 'bright', 'gold', 'green', 'grey', 'iron', 'red', 'stone', 'white', 'wolf', 'silver', 'moon', 'star'],
      middle: ['brook', 'field', 'ford', 'hill', 'wood', 'water', 'smith', 'wright', 'leaf', 'song', 'whisper'],
      suffixes: ['born', 'ford', 'ton', 'wood', 'field', 'stone', 'brook', 'hill', 'ridge', 'vale', 'song', 'leaf', 'wind', 'star']
    },
    patterns: ['P', 'PS', 'PM'],
    constraints: {
      minLength: 4,
      maxLength: 15,
      syllableCount: { min: 1, max: 2 }
    }
  }
}

export const humanNames: AncestryNameConfig = {
  male: {
    syllables: {
      prefixes: ['al', 'ar', 'bran', 'cor', 'dar', 'ed', 'gar', 'har', 'jon', 'mar', 'ric', 'rob', 'tha', 'wil'],
      middle: ['an', 'en', 'in', 'on', 'ar', 'er', 'or', 'ic', 'rick', 'bert', 'win', 'fred'],
      suffixes: ['ard', 'bert', 'mund', 'win', 'fred', 'ric', 'ton', 'son', 'den', 'ley']
    },
    patterns: ['PM', 'PS', 'PMS'],
    constraints: {
      minLength: 3,
      maxLength: 12,
      syllableCount: { min: 2, max: 3 }
    }
  },
  female: {
    syllables: {
      prefixes: ['al', 'an', 'bel', 'cat', 'el', 'ev', 'gwen', 'isa', 'mar', 'ros', 'sar', 'syl', 'vic'],
      middle: ['a', 'e', 'i', 'an', 'en', 'in', 'ara', 'ela', 'ina', 'lyn', 'eth'],
      suffixes: ['a', 'e', 'ine', 'ara', 'ella', 'lyn', 'beth', 'wen', 'dra', 'lia']
    },
    patterns: ['PM', 'PS', 'PMS'],
    constraints: {
      minLength: 3,
      maxLength: 12,
      syllableCount: { min: 2, max: 3 }
    }
  },
  surnames: {
    syllables: {
      prefixes: ['ash', 'black', 'bright', 'gold', 'green', 'grey', 'iron', 'red', 'stone', 'white', 'wolf'],
      middle: ['brook', 'field', 'ford', 'hill', 'wood', 'water', 'smith', 'wright'],
      suffixes: ['born', 'ford', 'ton', 'wood', 'field', 'stone', 'brook', 'hill', 'ridge', 'vale']
    },
    patterns: ['P', 'PS', 'PM'],
    constraints: {
      minLength: 4,
      maxLength: 15,
      syllableCount: { min: 1, max: 2 }
    }
  }
}

export const elfNames: AncestryNameConfig = {
  male: {
    syllables: {
      prefixes: ['ae', 'al', 'cel', 'el', 'en', 'er', 'gal', 'gil', 'leg', 'lin', 'tha', 'thy', 'val'],
      middle: ['a', 'e', 'i', 'o', 'an', 'en', 'in', 'on', 'ar', 'or', 'ad', 'ed'],
      suffixes: ['dir', 'las', 'lon', 'mir', 'neth', 'reth', 'rond', 'thil', 'wen', 'wing']
    },
    patterns: ['PM', 'PS', 'PMS'],
    constraints: {
      minLength: 4,
      maxLength: 14,
      syllableCount: { min: 2, max: 3 }
    }
  },
  female: {
    syllables: {
      prefixes: ['al', 'ar', 'cel', 'el', 'gal', 'gil', 'nim', 'sil', 'tar', 'thy', 'val'],
      middle: ['a', 'e', 'i', 'o', 'ae', 'ai', 'an', 'ar', 'el', 'en', 'in'],
      suffixes: ['ath', 'iel', 'wen', 'wyn', 'riel', 'neth', 'thil', 'lia', 'ara', 'ina']
    },
    patterns: ['PM', 'PS', 'PMS'],
    constraints: {
      minLength: 4,
      maxLength: 14,
      syllableCount: { min: 2, max: 3 }
    }
  },
  surnames: {
    syllables: {
      prefixes: ['bright', 'silver', 'moon', 'star', 'sun', 'wind', 'storm', 'flame', 'shadow', 'mist'],
      middle: ['leaf', 'song', 'whisper', 'dance', 'flame', 'stream', 'light'],
      suffixes: ['song', 'leaf', 'wind', 'star', 'moon', 'light', 'bow', 'blade', 'heart', 'wing']
    },
    patterns: ['PS', 'PM'],
    constraints: {
      minLength: 4,
      maxLength: 16,
      syllableCount: { min: 1, max: 2 }
    }
  }
}

export const dwarfNames: AncestryNameConfig = {
  male: {
    syllables: {
      prefixes: ['bor', 'dain', 'dur', 'fal', 'gim', 'gro', 'kil', 'nor', 'ori', 'tho', 'ulf', 'bal'],
      middle: ['an', 'ar', 'in', 'or', 'un', 'am', 'im', 'om', 'ek', 'ok', 'uk'],
      suffixes: ['in', 'on', 'un', 'li', 'ri', 'din', 'dor', 'dur', 'grim', 'helm']
    },
    patterns: ['PM', 'PS', 'PMS'],
    constraints: {
      minLength: 3,
      maxLength: 12,
      syllableCount: { min: 2, max: 3 }
    }
  },
  female: {
    syllables: {
      prefixes: ['bal', 'dar', 'dor', 'fal', 'hil', 'kira', 'nala', 'rial', 'tova', 'vera'],
      middle: ['a', 'e', 'i', 'an', 'en', 'in', 'ar', 'er', 'or'],
      suffixes: ['a', 'i', 'ana', 'ina', 'wen', 'dis', 'la', 'ra', 'wa']
    },
    patterns: ['PM', 'PS', 'PMS'],
    constraints: {
      minLength: 3,
      maxLength: 12,
      syllableCount: { min: 2, max: 3 }
    }
  },
  surnames: {
    syllables: {
      prefixes: ['iron', 'stone', 'gold', 'steel', 'hammer', 'forge', 'mountain', 'deep', 'rock', 'coal'],
      middle: ['beard', 'fist', 'hammer', 'pick', 'shield', 'axe'],
      suffixes: ['beard', 'fist', 'hammer', 'pick', 'shield', 'axe', 'born', 'song', 'heart', 'forge']
    },
    patterns: ['P', 'PS', 'PM'],
    constraints: {
      minLength: 4,
      maxLength: 18,
      syllableCount: { min: 1, max: 2 }
    }
  }
}

export const halflingNames: AncestryNameConfig = {
  male: {
    syllables: {
      prefixes: ['bil', 'bob', 'dro', 'fro', 'mer', 'per', 'pip', 'sam', 'ted', 'tom', 'ban', 'pod'],
      middle: ['a', 'e', 'i', 'o', 'er', 'ar', 'in', 'on', 'od', 'id'],
      suffixes: ['bo', 'do', 'go', 'to', 'rin', 'ron', 'son', 'wich', 'wick', 'wise']
    },
    patterns: ['PM', 'PS', 'PMS'],
    constraints: {
      minLength: 3,
      maxLength: 11,
      syllableCount: { min: 2, max: 3 }
    }
  },
  female: {
    syllables: {
      prefixes: ['bell', 'daisy', 'hol', 'lil', 'may', 'prim', 'ros', 'rue', 'poppy', 'pearl'],
      middle: ['a', 'e', 'i', 'o', 'an', 'en', 'in', 'la', 'ly'],
      suffixes: ['a', 'y', 'ie', 'ina', 'ella', 'wyn', 'rose', 'lily', 'belle']
    },
    patterns: ['PM', 'PS', 'PMS'],
    constraints: {
      minLength: 3,
      maxLength: 12,
      syllableCount: { min: 2, max: 3 }
    }
  },
  surnames: {
    syllables: {
      prefixes: ['bag', 'took', 'brand', 'boff', 'brown', 'good', 'green', 'under', 'over', 'hedge'],
      middle: ['hill', 'buck', 'foot', 'bottom', 'top', 'burrow'],
      suffixes: ['gins', 'buck', 'foot', 'bottom', 'hill', 'burrow', 'field', 'garden', 'meadow']
    },
    patterns: ['PS', 'PM'],
    constraints: {
      minLength: 3,
      maxLength: 16,
      syllableCount: { min: 1, max: 2 }
    }
  }
}

export const nameConfigs = {
  human: humanNames,
  elf: elfNames,
  dwarf: dwarfNames,
  halfling: halflingNames
} as const