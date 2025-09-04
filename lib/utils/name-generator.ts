export interface NamePatterns {
  syllables: {
    prefixes: string[]
    middle: string[]
    suffixes: string[]
  }
  patterns: string[]
  constraints: {
    minLength: number
    maxLength: number
    syllableCount: { min: number, max: number }
  }
}

export interface NameConfig {
  male?: NamePatterns
  female?: NamePatterns
  surnames?: NamePatterns
  unisex?: NamePatterns
}

export class NameGenerator {
  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  private static generateFromPattern(config: NamePatterns, pattern: string): string {
    let name = ''
    
    for (const char of pattern) {
      switch (char) {
        case 'P':
          name += this.getRandomElement(config.syllables.prefixes)
          break
        case 'M':
          name += this.getRandomElement(config.syllables.middle)
          break
        case 'S':
          name += this.getRandomElement(config.syllables.suffixes)
          break
      }
    }
    
    return name
  }

  private static meetsConstraints(name: string, config: NamePatterns): boolean {
    const length = name.length
    return length >= config.constraints.minLength && length <= config.constraints.maxLength
  }

  private static generateName(config: NamePatterns): string {
    const maxAttempts = 50
    let attempt = 0
    
    while (attempt < maxAttempts) {
      const pattern = this.getRandomElement(config.patterns)
      const name = this.generateFromPattern(config, pattern)
      
      if (this.meetsConstraints(name, config)) {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
      }
      
      attempt++
    }
    
    const fallbackPattern = config.patterns[0]
    const name = this.generateFromPattern(config, fallbackPattern)
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  }

  static generateFirstName(raceConfig: NameConfig, gender?: 'male' | 'female'): string {
    if (raceConfig.unisex) {
      return this.generateName(raceConfig.unisex)
    }
    
    if (gender === 'male' && raceConfig.male) {
      return this.generateName(raceConfig.male)
    }
    
    if (gender === 'female' && raceConfig.female) {
      return this.generateName(raceConfig.female)
    }
    
    const availableConfigs = [raceConfig.male, raceConfig.female].filter(Boolean) as NamePatterns[]
    if (availableConfigs.length > 0) {
      return this.generateName(this.getRandomElement(availableConfigs))
    }
    
    throw new Error('No valid name configuration found')
  }

  static generateSurname(raceConfig: NameConfig): string {
    if (!raceConfig.surnames) {
      throw new Error('No surname configuration found')
    }
    
    return this.generateName(raceConfig.surnames)
  }

  static generateFullName(raceConfig: NameConfig, gender?: 'male' | 'female'): string {
    const firstName = this.generateFirstName(raceConfig, gender)
    
    if (raceConfig.surnames) {
      const surname = this.generateSurname(raceConfig)
      return `${firstName} ${surname}`
    }
    
    return firstName
  }
}