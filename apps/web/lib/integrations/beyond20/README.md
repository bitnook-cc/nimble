# Beyond20 Integration

Integration with the [Beyond20 browser extension](https://beyond20.here-for-more.info/) to enable sending dice rolls from Sidekick to Virtual Tabletop platforms (Roll20, Foundry VTT, etc.).

**✅ Integration is ACTIVE! Dice rolls are now being sent to VTT platforms when Beyond20 is enabled.**

## Features

- **Automatic Detection**: Detects if Beyond20 extension is installed ✅
- **Settings Toggle**: Enable/disable integration via app settings ✅
- **Status Indication**: Visual feedback when Beyond20 is detected/not detected ✅
- **Roll Sending**: Send rolls to VTT platforms ✅ **CONNECTED AND WORKING**

## Setup (for users)

1. Install the [Beyond20 browser extension](https://beyond20.here-for-more.info/)
2. Add Sidekick's domain to Beyond20's custom domains list:
   - Click the Beyond20 icon in browser toolbar
   - Go to Settings → Custom Domains
   - Add your Sidekick domain (e.g., `localhost:3000` or your production domain)
3. In Sidekick, open Settings and toggle "Beyond20" under VTT Integration

## Implementation Status

### Phase 1: Detection & Setup ✅ COMPLETE

- [x] Beyond20 detection service
- [x] React hook for integration status
- [x] Settings toggle in UI
- [x] Visual status indicators
- [x] Roll conversion logic (built and tested)
- [x] Beyond20SharingService implementation

### Phase 2: Roll Integration ✅ COMPLETE

- [x] **Connected to ActivityLogService**
- [x] Actually sending rolls to VTT platforms
- [x] Error handling with console warnings
- [ ] Activity log indicators for sent rolls (future enhancement)

### Phase 3: Advanced Rolls (TODO)

- [ ] Attack rolls with damage
- [ ] Ability rolls with custom dice
- [ ] Spell rolls

### Phase 4: Polish (TODO)

- [ ] Activity log entries for VTT-sent rolls
- [ ] Error handling
- [ ] User documentation

## API Reference

See [Beyond20 API Documentation](https://beyond20.here-for-more.info/api.html) for details.

### Key Events

- `Beyond20_Loaded`: Fired when Beyond20 is detected
- `Beyond20_SendMessage`: Send roll requests to VTT

### Example Usage

```typescript
import { beyond20DetectionService, useBeyond20 } from "@/lib/integrations/beyond20";

// In a React component
const { isInstalled, settings } = useBeyond20();

// Direct service access
if (beyond20DetectionService.getIsInstalled()) {
  // Send roll via Beyond20 (Phase 2)
}
```
