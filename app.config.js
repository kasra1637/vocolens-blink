/**
 * app.config.js  (replaces the static app.json at bundle time)
 *
 * Why this file exists
 * ─────────────────────
 * app.json's `extra` block is static — it cannot read environment variables.
 * That means Constants.expoConfig.extra.EXPO_PUBLIC_DEEPGRAM_API_KEY was
 * always `undefined` at runtime, even after the EAS secrets were set correctly.
 *
 * This file runs at bundle time (both `eas update` and `eas build`) and
 * injects EXPO_PUBLIC_* keys into `extra` so they are reliably accessible
 * via Constants.expoConfig.extra on the device — in addition to the normal
 * process.env path which only works in some bundler contexts.
 *
 * Safe to commit — no secret values are hardcoded here, only env var references.
 */

export default ({ config }) => ({
  ...config,
  name: 'vocolens',
  slug: 'vocolens',
  scheme: 'vocolens',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.vocolens.app',
  },
  android: {
    package: 'com.vocolens.app',
    softwareKeyboardLayoutMode: 'pan',
  },
  web: {
    bundler: 'metro',
  },
  experiments: {
    typedRoutes: true,
  },
  plugins: [
    'expo-router',
    [
      'expo-build-properties',
      {
        ios: { useFrameworks: 'static' },
        android: { usesCleartextTraffic: true },
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'Allow Vocolens to use biometrics to unlock your private journal.',
      },
    ],
    'expo-updates',
    'react-native-adapty',
  ],
  owner: 'kasra1637',
  runtimeVersion: {
    policy: 'fingerprint',
  },
  updates: {
    url: 'https://u.expo.dev/743d876a-6e89-4b1f-9e42-816a67b84a35',
  },
  extra: {
    router: {},
    eas: {
      projectId: '743d876a-6e89-4b1f-9e42-816a67b84a35',
    },
    // Injected at bundle time from EAS secrets or local .env file.
    // These values land in Constants.expoConfig.extra on the device.
    EXPO_PUBLIC_DEEPGRAM_API_KEY:
      process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY ?? null,
    EXPO_PUBLIC_OPENROUTER_API_KEY:
      process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? null,
    EXPO_PUBLIC_ADAPTY_KEY:
      process.env.EXPO_PUBLIC_ADAPTY_KEY ?? null,
    EXPO_PUBLIC_BACKEND_URL:
      process.env.EXPO_PUBLIC_BACKEND_URL ?? null,
  },
});
