# Nimble Navigator

A comprehensive digital character sheet application for the Nimble RPG system. Navigate your adventures with ease using this intuitive character management tool. Built with Next.js, TypeScript, and Tailwind CSS, featuring offline-first architecture with local storage persistence.

![Nimble Navigator Preview](https://img.shields.io/badge/Status-Complete-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.0+-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-38bdf8)

## 🚀 Recent Updates

### Multiple Effects Per Feature (December 2024)

- Features can now grant multiple effects (abilities, resources, boosts, etc.)
- Improved effect tracking system with granular source attribution
- New UI components for displaying complex feature effects
- Better support for multi-benefit class and ancestry features

## ✨ Features

### Core Character Management

- **Multiple Characters**: Create, switch between, and manage multiple characters
- **App Modes**: Basic mode (simplified) or Full mode (complete character sheet)
- **Class System**: Four core classes (Fighter, Wizard, Cleric, Rogue) with level progression
- **Subclass System**: Specialized subclasses unlock at appropriate levels with unique features
- **Ancestry System**: Character origins with size categories, stat boosts, proficiencies and resistances
- **Background System**: Character histories with passive features and cultural descriptions
- **Custom Content**: Upload and manage custom classes, ancestries, backgrounds, abilities, and spells
- **Level Progression**: Automatic feature grants and hit dice advancement
- **Attributes**: Strength, Dexterity, Intelligence, Will (range: -2 to 10)
- **Hit Points**: Current/Max HP with temporary HP support (D&D 5e rules)
- **Action Tracker**: Combat action management with encounter tracking
- **Skills**: 10 predefined skills with attribute associations and custom modifiers

### Combat & Rolling

- **Dice System**: Advanced d20 mechanics with advantage/disadvantage
- **Attack Rolls**: Exploding criticals, miss on natural 1
- **Ability Rolls**: Custom dice expressions with attribute modifiers
- **Saving Throws**: Separate buttons for each attribute
- **Activity Log**: Comprehensive action and dice roll tracking

### Abilities & Actions

- **Ability System**: Freeform and action abilities with usage tracking
- **Frequency Types**: Per-turn, per-encounter, and at-will abilities
- **Roll Integration**: Abilities can trigger custom dice rolls
- **Smart Resets**: Automatic ability resets on turn/encounter end
- **Actions Panel**: Quick access to equipped weapons and usable abilities

### Equipment & Inventory

- **Equipment Management**: Weapons, armor, and freeform items
- **Armor Types**: Main armor vs supplementary armor with automatic replacement
- **Size-Based Limits**: Configurable weapon size restrictions
- **Smart Inventory**: Equipped items don't count toward size limits
- **Dex Bonus Calculation**: Armor-aware dexterity bonus with visual indicators

### Resource Management

- **Generic Resources**: Customizable resource pools (mana, fury, focus, stamina, etc.)
- **Color Schemes**: 8 predefined color schemes with percentage-based gradients
- **Icon System**: 23+ categorized icons (magic, combat, nature, etc.)
- **Reset Conditions**: Per-turn, per-encounter, safe rest, never, or manual
- **Reset Types**: To maximum, to zero, or to custom default value
- **Resource Bar**: Visual progress bars with color-coded status
- **Quick Actions**: Fast spend/restore buttons (1, 3, 5) plus custom amounts
- **Activity Logging**: Comprehensive tracking of resource usage

### Advanced Features

- **Class Progression**: Automatic feature grants based on class and level
- **Subclass Selection**: Choose specializations that provide unique abilities
- **Feature Tracking**: Complete history of granted features with validation
- **Temporary HP**: D&D 5e compliant damage absorption
- **Encounter Management**: Turn-based mechanics with action tracking
- **Settings Panel**: Global app configuration and mode switching
- **Character Selector**: Easy character creation and switching
- **Responsive Design**: Mobile-first with collapsible sections
- **Offline-First**: No server required, works completely offline
- **Auto-Save**: All data persists to local storage automatically

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nimble

# Install dependencies
npm install

# Start development server
npm run dev

# Open your browser to http://localhost:3000
```

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## 🎮 How to Use

### Getting Started

1. **App Menu**: Click the gear icon to access settings and character selection
2. **Mode Selection**: Choose Basic mode (simplified) or Full mode (complete)
3. **Character Creation**: Use the character selector to create new characters
4. **Character Switching**: Easily switch between existing characters

### Character Setup

1. **Name**: Click the character name to edit
2. **Class Selection**: Choose from Fighter, Wizard, Cleric, or Rogue
3. **Ancestry Selection**: Choose from Human, Elf, Dwarf, Halfling, or upload custom ancestries
4. **Background Selection**: Choose from Noble, Scholar, Soldier, Folk Hero, or upload custom backgrounds
5. **Level Progression**: Set character level to automatically grant class features
6. **Subclass Choice**: Select subclass specializations when they become available
7. **Attributes**: Use the number inputs to set attribute values (-2 to 10)
8. **Hit Points**: Set max HP and track current/temporary HP with hit dice
9. **Skills**: Adjust skill modifiers (0-20) for each of the 10 skills
10. **Resources**: Configure custom resource pools with color schemes and icons
11. **Abilities**: Add custom abilities with usage frequencies and roll mechanics

### Combat & Rolling

1. **Advantage/Disadvantage**: Use the global toggle at the top
2. **Attribute Rolls**: Click "Roll" for checks or "Save" for saving throws
3. **Skill Rolls**: Roll individual skills with automatic attribute bonuses
4. **Attack Rolls**: Equip weapons to see attack actions with damage
5. **Ability Rolls**: Use abilities that automatically trigger custom dice rolls
6. **Initiative**: Roll initiative to start encounters and set action counts

### Action Management

1. **Action Tracker**: Monitor current actions during encounters
2. **End Turn**: Reset actions and per-turn abilities
3. **End Encounter**: Exit combat and reset all abilities
4. **Actions Panel**: Quick access to weapons and abilities

### Quick Tips

- **Equipment**: Use inventory to add items, toggle equip/unequip for weapons and armor
- **Resources**: Create custom pools with color schemes and icons, use quick adjustment buttons
- **Health**: Use quick damage/heal buttons or enter custom amounts, temporary HP absorbs damage first
- **Combat**: Roll initiative to start encounters, use action tracker to manage turn-based combat

## 🏗️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS + shadcn/ui components
- **Validation**: Zod for runtime type checking
- **Storage**: Local Storage with repository abstraction
- **Icons**: Lucide React icons

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with Next.js recommended rules
- **Type Safety**: Runtime validation with Zod schemas
- **Component Architecture**: Modular, reusable components

## 🚀 Deployment

The app is built as a static Next.js application and can be deployed to any static hosting service:

- **Vercel**: Deploy directly from Git repository
- **Netlify**: Drag and drop the `out` folder after `npm run build`
- **GitHub Pages**: Use the static export output
- **Any CDN**: Upload the build output to your preferred hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎲 Nimble RPG

Nimble Navigator is designed for the Nimble RPG system. For game rules and additional resources, visit the official Nimble RPG website.

---

**Built with ❤️ for the Nimble RPG community**
