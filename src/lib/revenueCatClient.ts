/**
 * RevenueCat Client
 *
 * Drop-in replacement for adaptyClient.ts — same guard pattern,
 * same result shape, same public API surface so callers change minimally.
 *
 * SDK: react-native-purchases v10.x
 * Entitlement: "Vocolens Pro"
 * Products:  monthly | three_month | yearly
 *
 * ─── Test Store ────────────────────────────────────────────────────────────
 * The API key uses the `test_` prefix which activates RevenueCat's built-in
 * Test Store. This means:
 *   • No App Store Connect / Google Play Console setup required for testing
 *   • Purchases show a "This is a test purchase only" dialog
 *   • Entitlements, CustomerInfo, and dashboard events work like production
 *   • Must run in a DEVELOPMENT BUILD (not Expo Go) — native module required
 *
 * To build a dev client: `npx eas build --profile development --platform ios`
 * Then run with: `npx expo start --dev-client`
 */

import { Platform } from "react-native";
import type { CustomerInfo, PurchasesOffering, PurchasesPackage, LOG_LEVEL } from "react-native-purchases";

// ── Constants ─────────────────────────────────────────────────────────────────
export const RC_ENTITLEMENT = "Vocolens Pro";

// Test Store API keys (prefixed with `test_`).
// These activate RevenueCat's sandbox Test Store — no real charges are made.
// Replace with production platform-specific keys before shipping to stores.
const API_KEY_IOS = "test_mVoTgVAijXxZUyvweENUiQCbdeC";
const API_KEY_ANDROID = "test_mVoTgVAijXxZUyvweENUiQCbdeC";

// ── Result type (mirrors old Adapty shape) ────────────────────────────────────
export type RCGuardReason = "web_not_supported" | "not_configured" | "sdk_error";
export type RCResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: RCGuardReason; error?: unknown };

// ── Lazy-load native module ───────────────────────────────────────────────────
let Purchases: typeof import("react-native-purchases").default | null = null;
let nativeAvailable = false;

try {
  Purchases = require("react-native-purchases").default;
  nativeAvailable = true;
} catch {
  // Native module unavailable. This is expected in Expo Go — the app MUST be
  // run as a development build for RevenueCat to work.
  // Build with: `npx eas build --profile development --platform <ios|android>`
  // Run with:   `npx expo start --dev-client`
  if (__DEV__) {
    console.warn(
      "[RevenueCat] Native module not available. This is expected in Expo Go.\n" +
      "To test purchases, build a development client:\n" +
      "  npx eas build --profile development --platform ios\n" +
      "  npx expo start --dev-client"
    );
  }
}

const isWeb = Platform.OS === "web";
const isEnabled = !isWeb && nativeAvailable;

let configured = false;
const LOG = "[RevenueCat]";

// ── Guard helper ──────────────────────────────────────────────────────────────
async function guard<T>(
  action: string,
  op: () => Promise<T>,
): Promise<RCResult<T>> {
  if (isWeb) return { ok: false, reason: "web_not_supported" };
  if (!isEnabled || !Purchases) {
    if (__DEV__) {
      console.log(`${LOG} ${action} skipped — native module not available (need dev build)`);
    }
    return { ok: false, reason: "not_configured" };
  }
  try {
    return { ok: true, data: await op() };
  } catch (error: any) {
    console.log(`${LOG} ${action} failed:`, error?.message ?? error);
    return { ok: false, reason: "sdk_error", error };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns true when the SDK can make real purchases on this platform. */
export const isRevenueCatEnabled = (): boolean => isEnabled;

/**
 * Configure the SDK once per app launch.
 * Safe to call multiple times — subsequent calls are no-ops.
 *
 * Uses the Test Store API key (test_ prefix) which automatically routes
 * purchases through RevenueCat's sandbox Test Store — shows test purchase
 * dialogs and never charges real money.
 */
export const configureRevenueCat = (): void => {
  if (!isEnabled || !Purchases || configured) return;
  try {
    const apiKey = Platform.OS === "ios" ? API_KEY_IOS : API_KEY_ANDROID;

    // Enable verbose logging in development so test purchase flows are visible
    if (__DEV__) {
      try {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.VERBOSE);
      } catch {
        // LOG_LEVEL may not be available on all SDK versions — non-critical
      }
    }

    Purchases.configure({ apiKey });
    configured = true;

    const isTestStore = apiKey.startsWith("test_");
    console.log(
      `${LOG} SDK configured (${Platform.OS}) | ` +
      `Test Store: ${isTestStore ? "YES — sandbox purchases enabled" : "NO — production mode"}`
    );
  } catch (e: any) {
    console.log(`${LOG} configure failed:`, e?.message ?? e);
  }
};

/** Fetch the current customer info (entitlements, active subscriptions). */
export const getCustomerInfo = (): Promise<RCResult<CustomerInfo>> =>
  guard("getCustomerInfo", () => Purchases!.getCustomerInfo());

/** Check whether a given entitlement is currently active. */
export const hasEntitlement = (
  info: CustomerInfo,
  entitlementId: string = RC_ENTITLEMENT,
): boolean => info.entitlements.active[entitlementId]?.isActive === true;

/** Fetch available offerings from RevenueCat dashboard. */
export const getOfferings = (): Promise<RCResult<{ offerings: PurchasesOffering[]; current: PurchasesOffering | null }>> =>
  guard("getOfferings", async () => {
    const result = await Purchases!.getOfferings();
    if (__DEV__) {
      const pkgCount = result.current?.availablePackages?.length ?? 0;
      console.log(
        `${LOG} Offerings loaded | Current: "${result.current?.identifier ?? "none"}" | ` +
        `Packages: ${pkgCount} | All offerings: ${Object.keys(result.all).length}`
      );
    }
    return {
      offerings: Object.values(result.all),
      current: result.current ?? null,
    };
  });

/** Purchase a package. Returns updated CustomerInfo on success. */
export const purchasePackage = (
  pkg: PurchasesPackage,
): Promise<RCResult<CustomerInfo>> =>
  guard("purchasePackage", async () => {
    if (__DEV__) {
      console.log(`${LOG} Initiating purchase: ${pkg.identifier} (${pkg.product?.identifier})`);
    }
    const { customerInfo } = await Purchases!.purchasePackage(pkg);
    return customerInfo;
  });

/** Restore previous purchases. Returns updated CustomerInfo. */
export const restorePurchases = (): Promise<RCResult<CustomerInfo>> =>
  guard("restorePurchases", async () => {
    const customerInfo = await Purchases!.restorePurchases();
    return customerInfo;
  });

/**
 * Identify the user (anonymous by default).
 * Call this after the user signs in / you have a stable user ID.
 */
export const identifyUser = async (userId: string): Promise<void> => {
  if (!isEnabled || !Purchases) return;
  try {
    await Purchases!.logIn(userId);
    console.log(`${LOG} User identified: ${userId}`);
  } catch (e: any) {
    console.log(`${LOG} logIn failed:`, e?.message ?? e);
  }
};

/** Reset the user to anonymous (call on sign-out). */
export const resetUser = async (): Promise<void> => {
  if (!isEnabled || !Purchases) return;
  try {
    await Purchases!.logOut();
    console.log(`${LOG} User reset to anonymous`);
  } catch (e: any) {
    console.log(`${LOG} logOut failed:`, e?.message ?? e);
  }
};

/**
 * Listen for CustomerInfo updates (subscription changes in background).
 * Returns a cleanup function — call it in useEffect cleanup.
 */
export const addCustomerInfoListener = (
  callback: (info: CustomerInfo) => void,
): (() => void) => {
  if (!isEnabled || !Purchases) return () => {};
  const customerInfoUpdatedListener = Purchases!.addCustomerInfoUpdateListener(callback);
  return () => {
    try { customerInfoUpdatedListener?.remove?.(); } catch {}
  };
};
