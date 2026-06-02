import "react-native-get-random-values";
import "react-native-reanimated";
import "../../global.css";
import { LogBox } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/lib/useColorScheme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthGate } from "@/components/AuthGate";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
import { useEffect } from "react";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";

LogBox.ignoreLogs([
  "Expo AV has been deprecated",
  "Disconnected from Metro",
  "SafeAreaView has been deprecated",
  "expo-notifications",
  "[expo-notifications]",
]);

export const unstable_settings = {
  initialRouteName: "(tabs)",
  animationEnabled: false,
};

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

// Always use a dark background so @react-navigation never paints white
// behind tab screens — the app's LinearGradient covers it but there is
// one native frame before JS runs where the navigator background shows.
const DARK_BG = "#0F0E1A";
const AppDarkTheme  = { ...DarkTheme,    colors: { ...DarkTheme.colors,    background: DARK_BG, card: DARK_BG } };
const AppLightTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: DARK_BG, card: DARK_BG } };

function RootLayoutNav({
  colorScheme,
}: {
  colorScheme: "light" | "dark" | null | undefined;
}) {
  return (
    <ThemeProvider value={colorScheme === "dark" ? AppDarkTheme : AppLightTheme}>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, contentStyle: { backgroundColor: DARK_BG } }}
        />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="entry-detail"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="reflection"
          options={{ headerShown: false, presentation: "fullScreenModal", gestureEnabled: false }}
        />
        <Stack.Screen
          name="privacy-settings"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="language-picker"
          options={{ headerShown: false, presentation: "fullScreenModal", gestureEnabled: true }}
        />
        <Stack.Screen
          name="legal"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="correction-history"
          options={{ headerShown: false, presentation: "card" }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* backgroundColor on root so there is never a white layer at any level */}
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: DARK_BG }}>
        <StatusBar style="light" />
        <AuthGate>
          <RootLayoutNav colorScheme={colorScheme} />
          <MilestoneCelebration />
        </AuthGate>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
