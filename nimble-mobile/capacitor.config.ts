import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nimblenavigator.app',
  appName: 'Nimble Navigator',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
