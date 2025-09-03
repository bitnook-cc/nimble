# Nimble Navigator Mobile

This is the Capacitor wrapper for the Nimble Navigator web app, enabling it to run as a native mobile application on iOS and Android.

## Setup

The mobile wrapper is already configured. The main web app builds to a static export that gets packaged into the mobile app.

## Development Workflow

### 1. Build and Sync
```bash
cd nimble-mobile
npm run sync
```
This builds the web app and syncs it to the mobile platforms.

### 2. Open in Native IDEs
```bash
# iOS (requires Xcode)
npm run open:ios

# Android (requires Android Studio)
npm run open:android
```

### 3. Run on Device/Simulator
```bash
# iOS
npm run run:ios

# Android  
npm run run:android
```

## Available Scripts

- `npm run build` - Build web app and copy to mobile dist
- `npm run build:web` - Build web app only
- `npm run copy:web` - Copy existing web build to mobile
- `npm run sync` - Build and sync to platforms
- `npm run open:ios` - Open iOS project in Xcode
- `npm run open:android` - Open Android project in Android Studio
- `npm run run:ios` - Build, sync, and run on iOS
- `npm run run:android` - Build, sync, and run on Android

## Configuration

- **App ID**: `com.nimblenavigator.app`
- **App Name**: Nimble Navigator
- **Web Directory**: `dist` (built from parent Next.js app)

## Requirements

### iOS Development
- macOS
- Xcode 12+
- iOS Simulator or physical iOS device

### Android Development
- Android Studio
- Android SDK
- Android emulator or physical Android device

## Project Structure

```
nimble-mobile/
├── capacitor.config.ts    # Capacitor configuration
├── package.json          # Mobile-specific scripts
├── dist/                 # Built web app (generated)
├── ios/                  # iOS native project
└── android/              # Android native project
```

## Notes

- The web app runs in a native WebView container
- Local storage and offline features work seamlessly
- No changes needed to the main web app code
- The app maintains all existing functionality while gaining native mobile capabilities