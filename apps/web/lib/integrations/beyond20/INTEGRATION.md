# Beyond20 VTT Integration

## ✅ CURRENT STATUS: ACTIVE

**The Beyond20 integration is now fully connected and operational. Dice rolls ARE being sent to VTT platforms when Beyond20 is enabled.**

## Overview

The Beyond20 integration allows Sidekick users to seamlessly send their Nimble RPG dice rolls to Virtual Tabletop (VTT) platforms during online play sessions. This integration leverages the [Beyond20 browser extension](https://beyond20.here-for-more.info/), which acts as a bridge between character sheet websites and VTT platforms.

## Supported VTT Platforms

Through Beyond20, Sidekick can send rolls to:

- **Roll20**
- **Foundry VTT**
- **Astral Tabletop**
- **Discord (with dice bots)**
- **DNDBeyond's Digital Dice**

## How It Works

### Architecture

```
┌─────────────┐
│   Sidekick  │
│ (Web App)   │
└──────┬──────┘
       │ 1. User makes roll
       │
       ▼
┌──────────────────┐
│ Activity Log     │
│ Service          │
└──────┬───────────┘
       │ 2. Log entry created
       │
       ▼
┌──────────────────┐
│ Beyond20 Sharing │
│ Service          │
└──────┬───────────┘
       │ 3. Convert to Beyond20 format
       │ 4. Dispatch CustomEvent
       │
       ▼
┌──────────────────┐
│ Beyond20         │
│ Extension        │
└──────┬───────────┘
       │ 5. Forward to VTT
       │
       ▼
┌──────────────────┐
│ VTT Platform     │
│ (Roll20, etc.)   │
└──────────────────┘
```

### Data Flow

1. **User Action**: Player clicks a roll button in Sidekick
2. **Dice Roll**: DiceService calculates the roll result
3. **Activity Logging**: ActivityLogService creates a log entry
4. **Beyond20 Check**: Beyond20SharingService checks if integration is enabled
5. **Conversion**: Log entry is converted to Beyond20 roll request format
6. **Event Dispatch**: CustomEvent `Beyond20_SendMessage` is dispatched
7. **Extension Handling**: Beyond20 extension receives the event
8. **VTT Delivery**: Beyond20 sends the roll to the connected VTT platform

## Setup Instructions

### For Users

1. **Install Beyond20 Extension**
   - Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/beyond20/gnblbpbepfbfmoobegdogkglpbhdemli)
   - Firefox: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/beyond20/)
   - Edge: Available on Chrome Web Store

2. **Configure Beyond20**
   - Click the Beyond20 icon in your browser toolbar
   - Navigate to Settings → Custom Domains
   - Add your Sidekick domain:
     - Local development: `localhost:3000`
     - Production: Your deployed Sidekick URL

3. **Connect to VTT**
   - Open your VTT platform in another browser tab
   - Beyond20 will automatically detect and connect

4. **Enable in Sidekick**
   - Open Sidekick app
   - Click Menu → Settings
   - Under "VTT Integration", toggle "Beyond20" to ON
   - The green checkmark confirms Beyond20 is detected

5. **Test the Integration**
   - Make any dice roll in Sidekick
   - The roll should appear in your VTT chat
   - You'll see a console log: "Sent roll to Beyond20: {...}"

## Supported Roll Types

### Currently Supported

| Roll Type      | Description                                   | Beyond20 Type | Status        |
| -------------- | --------------------------------------------- | ------------- | ------------- |
| **Dice Rolls** | Generic dice rolls (d20 checks, damage, etc.) | `custom`      | ✅ Active     |
| **Initiative** | Initiative rolls at combat start              | `initiative`  | ✅ Active     |

### Conversion Details

**Dice Rolls (`DiceRollEntry`)**

- Includes roll description as name
- Converts advantage levels:
  - `advantageLevel > 0` → Advantage (1)
  - `advantageLevel < 0` → Disadvantage (2)
  - `advantageLevel = 0` → Normal (0)
- Detects d20 rolls for critical hit handling
- Uses substituted formulas when available (e.g., `1d20+STR` → `1d20+4`)

**Initiative Rolls (`InitiativeEntry`)**

- Sent as dedicated initiative type
- Always marked as d20 rolls
- Includes character name and level

### Planned Support

| Roll Type     | Description                  | Status     |
| ------------- | ---------------------------- | ---------- |
| Attack Rolls  | Weapon and spell attacks     | 📋 Planned |
| Damage Rolls  | Separate damage roll entries | 📋 Planned |
| Saving Throws | Attribute-based saves        | 📋 Planned |
| Skill Checks  | Skill-specific checks        | 📋 Planned |

## Technical Details

### Service: `Beyond20SharingService`

**Location**: `lib/integrations/beyond20/beyond20-sharing-service.ts`

**Key Methods**:

```typescript
// Send a dice roll to Beyond20
async sendRoll(entry: LogEntry, character: Character): Promise<void>

// Activate the Beyond20 extension icon
activateIcon(): void
```

**Roll Conversion Logic**:

```typescript
private convertToRollRequest(
  entry: LogEntry,
  character: Character
): Beyond20RollRequest | null
```

**Integration Checks**:

- Extension must be installed (detected via `Beyond20_Loaded` event)
- Integration must be enabled in Sidekick settings
- Valid character must be active

### Events

**Outgoing Events** (Sidekick → Beyond20):

```javascript
// Send a roll to VTT
new CustomEvent("Beyond20_SendMessage", {
  detail: [
    {
      action: "roll",
      type: "custom",
      character: { name: "Hero Name", level: 5 },
      name: "Attack Roll",
      roll: 18,
      formula: "1d20+5",
      advantage: 0,
      d20: true,
    },
  ],
});

// Activate Beyond20 icon
new CustomEvent("Beyond20_Activate_Icon");
```

**Incoming Events** (Beyond20 → Sidekick):

```javascript
// Extension loaded and ready
new CustomEvent("Beyond20_Loaded", {
  detail: [{ vtt: "roll20" /* settings */ }],
});
```

### Roll Request Format

```typescript
interface Beyond20RollRequest {
  action: "roll";
  type: string; // "custom", "initiative", etc.
  character?: {
    name: string;
    level?: number;
  };
  name?: string; // Roll description
  roll?: number; // Total result
  formula?: string; // Dice formula (e.g., "1d20+5")
  advantage?: number; // 0=normal, 1=advantage, 2=disadvantage
  d20?: boolean; // Whether this is a d20 roll
}
```

## Settings Integration

**Location**: `lib/services/settings-service.ts`

**Setting Key**: `beyond20Enabled: boolean`

**UI Control**: Settings Panel → VTT Integration → Beyond20 toggle

**Behavior**:

- Toggle disabled when Beyond20 not detected
- Visual indicators (checkmark/X) show detection status
- Activates extension icon when enabled

## Testing

**Test Suite**: `lib/integrations/beyond20/__tests__/beyond20-sharing-service.test.ts`

**Coverage**:

- ✅ Respects enabled/disabled settings
- ✅ Respects extension installed/not installed state
- ✅ Converts dice rolls correctly
- ✅ Handles advantage/disadvantage
- ✅ Sends initiative rolls
- ✅ Detects d20 vs other dice
- ✅ Uses substituted formulas
- ✅ Activates icon when enabled

**Run Tests**:

```bash
npm test -- beyond20-sharing-service
```

## Limitations & Known Issues

### Current Limitations

1. **Browser Only**: Integration only works in web browsers with the extension installed
   - Not available in native mobile apps (Capacitor)
   - Not available in electron/desktop builds

2. **One-Way Communication**:
   - Sidekick can send rolls to VTT
   - VTT cannot send data back to Sidekick

3. **Limited Roll Types**:
   - Only dice rolls and initiative currently supported
   - Attack/damage/skill/save rolls coming in Phase 2

4. **No Roll History Sync**:
   - Rolls sent to VTT don't update VTT character sheets
   - VTT-initiated rolls don't appear in Sidekick

### Browser Compatibility

| Browser         | Extension         | Status          |
| --------------- | ----------------- | --------------- |
| Chrome          | ✅ Available      | Fully Supported |
| Firefox         | ✅ Available      | Fully Supported |
| Edge            | ✅ Available      | Fully Supported |
| Safari          | ❌ Not Available  | Not Supported   |
| Mobile Browsers | ❌ Extensions N/A | Not Supported   |

## Future Enhancements

### Phase 2: Extended Roll Support

- [ ] Attack rolls with separate to-hit and damage
- [ ] Saving throw rolls
- [ ] Skill check rolls
- [ ] Ability check rolls
- [ ] Spell attack and damage rolls

### Phase 3: UI Improvements

- [ ] Visual indicator on roll buttons when Beyond20 is active
- [ ] Activity log shows "(→ VTT)" suffix for sent rolls
- [ ] Toast notification on first roll sent per session
- [ ] Connection status indicator in top bar

### Phase 4: Advanced Features

- [ ] Roll privacy settings (public/GM/private)
- [ ] Custom roll templates
- [ ] Batch roll sending
- [ ] VTT-specific formatting options

## Troubleshooting

### Beyond20 Not Detected

**Symptoms**: Gray X icon, toggle disabled, "extension not detected" message

**Solutions**:

1. Ensure Beyond20 extension is installed
2. Refresh the Sidekick page
3. Check browser console for `Beyond20_Loaded` event
4. Verify extension is enabled in browser settings

### Rolls Not Appearing in VTT

**Symptoms**: Rolls work in Sidekick but don't show in VTT

**Solutions**:

1. Verify Beyond20 toggle is ON in Sidekick settings
2. Check VTT tab is open and Beyond20 is connected
3. Look for Beyond20 icon in VTT tab (should be green/active)
4. Check browser console for "Sent roll to Beyond20" messages
5. Verify Sidekick domain is in Beyond20's custom domains list

### Advantage/Disadvantage Not Working

**Symptoms**: Advantage rolls show as normal rolls in VTT

**Solutions**:

1. Ensure you're using Sidekick's advantage toggle
2. Verify the roll description includes advantage indicator
3. Check Beyond20 settings in the extension
4. Some VTTs may display advantage differently

## Developer Notes

### Adding New Roll Types

To add support for a new log entry type:

1. **Update conversion logic** in `beyond20-sharing-service.ts`:

```typescript
private convertToRollRequest(entry: LogEntry, character: Character) {
  switch (entry.type) {
    case "roll": return this.convertDiceRoll(entry, character);
    case "initiative": return this.convertInitiativeRoll(entry, character);
    case "your-new-type": return this.convertYourNewType(entry, character);
    // ...
  }
}
```

2. **Add conversion method**:

```typescript
private convertYourNewType(
  entry: YourNewEntry,
  character: Character
): Beyond20RollRequest {
  return {
    action: "roll",
    type: "appropriate-beyond20-type",
    character: { name: character.name, level: character.level },
    // ... other fields
  };
}
```

3. **Add tests** in `__tests__/beyond20-sharing-service.test.ts`

4. **Update documentation** (this file)

### Integration Point

**The Beyond20 integration is now FULLY CONNECTED to the activity log service.**

Current state:
- ✅ All Beyond20 services are built and tested
- ✅ Roll conversion logic is complete
- ✅ Detection and settings UI work
- ✅ **ActivityLogService imports and calls beyond20SharingService**
- ✅ **Rolls ARE being sent to VTT platforms**

The integration was completed by:
1. Importing `beyond20SharingService` from `@/lib/integrations/beyond20` (line 4)
2. In `addLogEntry()` method, after session sharing (lines 150-157):
   ```typescript
   // Send to Beyond20 VTT integration if enabled
   if (currentCharacter) {
     try {
       await beyond20SharingService.sendRoll(newEntry, currentCharacter);
     } catch (error) {
       console.warn("Failed to send roll to Beyond20:", error);
     }
   }
   ```

The service gracefully handles errors and only sends rolls when:
- Beyond20 extension is installed
- Integration is enabled in settings
- A valid character is active

## References

- [Beyond20 Official Site](https://beyond20.here-for-more.info/)
- [Beyond20 API Documentation](https://beyond20.here-for-more.info/api.html)
- [Beyond20 GitHub](https://github.com/kakaroto/Beyond20)
- [Roll20](https://roll20.net/)
- [Foundry VTT](https://foundryvtt.com/)

## License

This integration uses the Beyond20 public API and is compatible with Beyond20's license. See Beyond20's [GitHub repository](https://github.com/kakaroto/Beyond20) for details.
