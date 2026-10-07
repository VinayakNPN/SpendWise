import React, { useEffect, useRef, useCallback } from "react";
import { AppState, Platform } from "react-native";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DashboardScreen } from "./src/screens/DashboardScreen";
import { RecurringPaymentsScreen } from "./src/screens/RecurringPaymentsScreen";
import { DebtScreen } from "./src/screens/DebtScreen";
import { ActivityScreen } from "./src/screens/ActivityScreen";
import { PFScreen } from "./src/screens/PFScreen";
import { TransactionDetailScreen } from "./src/screens/TransactionDetailScreen";
import { AIInsightsScreen } from "./src/screens/AIInsightsScreen";
import { InvestmentsScreen } from "./src/screens/InvestmentsScreen";
import { GoalPlannerScreen } from "./src/screens/GoalPlannerScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { NetWorthBreakdownScreen } from "./src/screens/NetWorthBreakdownScreen";
import { AccountsScreen } from "./src/screens/AccountsScreen";
import { ReconcileScreen } from "./src/screens/ReconcileScreen";
import { ReportsScreen } from "./src/screens/ReportsScreen";
import { ReceiptReviewScreen } from "./src/screens/ReceiptReviewScreen";
import { PaymentQueueScreen } from "./src/screens/PaymentQueueScreen";
import { ReceiptQueueReviewScreen } from "./src/screens/ReceiptQueueReviewScreen";
import { AppStoreProvider } from "./src/state/AppStore";
import { ThemeProvider, useTheme } from "./src/state/ThemeContext";
import { initDatabase } from "./src/services/database";
import { registerForPushNotificationsAsync } from "./src/services/notifications";
import { handleSharedIntent } from "./src/services/shareIntentHandler";
import { BiometricWrapper } from "./src/components/BiometricWrapper";
import { AppPrivacyToggle } from "./src/components/AppPrivacyToggle";

// ─── Navigators ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();
const AIStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();
const ActivityStack = createNativeStackNavigator();
const InvestStack = createNativeStackNavigator();
const QueueStack = createNativeStackNavigator();

const queryClient = new QueryClient();

// ─── Stack Navigators ─────────────────────────────────────────────────────────

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
      <DashboardStack.Screen name="RecurringPayments" component={RecurringPaymentsScreen} />
      <DashboardStack.Screen name="Reports" component={ReportsScreen} />
      <DashboardStack.Screen name="ReceiptReview" component={ReceiptReviewScreen} />
    </DashboardStack.Navigator>
  );
}

function AIStackNavigator() {
  return (
    <AIStack.Navigator screenOptions={{ headerShown: false }}>
      <AIStack.Screen name="AIHome" component={AIInsightsScreen} />
      <AIStack.Screen name="Goals" component={GoalPlannerScreen} />
    </AIStack.Navigator>
  );
}

function InvestStackNavigator() {
  return (
    <InvestStack.Navigator screenOptions={{ headerShown: false }}>
      <InvestStack.Screen name="InvestHome" component={InvestmentsScreen} />
      <InvestStack.Screen name="NetWorthBreakdown" component={NetWorthBreakdownScreen} />
    </InvestStack.Navigator>
  );
}

function ActivityStackNavigator() {
  return (
    <ActivityStack.Navigator screenOptions={{ headerShown: false }}>
      <ActivityStack.Screen name="ActivityHome" component={ActivityScreen} />
      <ActivityStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <ActivityStack.Screen name="ReceiptReview" component={ReceiptReviewScreen} />
    </ActivityStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} />
      <SettingsStack.Screen name="Accounts" component={AccountsScreen} />
      <SettingsStack.Screen name="Reconcile" component={ReconcileScreen} />
      <SettingsStack.Screen name="Debt" component={DebtScreen} />
      <SettingsStack.Screen name="PF" component={PFScreen} />
    </SettingsStack.Navigator>
  );
}

/**
 * Payment Queue stack — the entry point for shared receipts.
 * When the app is opened via a share intent we navigate here directly.
 */
function QueueStackNavigator() {
  return (
    <QueueStack.Navigator screenOptions={{ headerShown: false }}>
      <QueueStack.Screen name="PaymentQueueHome" component={PaymentQueueScreen} />
      <QueueStack.Screen name="ReceiptQueueReview" component={ReceiptQueueReviewScreen} />
    </QueueStack.Navigator>
  );
}

// ─── Share Intent Hook ────────────────────────────────────────────────────────

/**
 * Detects incoming Android share intents (ACTION_SEND with image data) and
 * routes the app to the Payment Queue screen with the shared image pre-loaded.
 *
 * Works for both cold-start (app was closed) and warm-start (app in background)
 * scenarios by listening to AppState changes as well as the initial intent.
 */
function useShareIntentHandler(navigationRef: React.RefObject<NavigationContainerRef<any> | null>) {
  const lastHandledUri = useRef<string | null>(null);

  const processIntent = useCallback(
    async (imageUri: string | null | undefined) => {
      if (!imageUri) return;
      // Avoid processing the same URI twice within the same session
      if (lastHandledUri.current === imageUri) return;
      lastHandledUri.current = imageUri;

      const result = await handleSharedIntent(imageUri);
      if (!result) return;

      const performNavigation = (queueItemId: string) => {
        let attempts = 0;
        const tryNav = () => {
          const nav = navigationRef.current;
          if (nav && nav.isReady()) {
            (nav as any).navigate('Queue');
            setTimeout(() => {
              (nav as any).navigate('Queue', {
                screen: 'ReceiptQueueReview',
                params: { queueItemId },
              });
            }, 200);
          } else if (attempts < 10) {
            attempts++;
            setTimeout(tryNav, 250);
          }
        };
        tryNav();
      };

      performNavigation(result.queueItemId);
    },
    [navigationRef],
  );

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // --- Cold start: detect intent from the initial URL / linking ---
    // expo-modules exposes the initial intent via Linking on Android
    const checkInitialIntent = async () => {
      try {
        const Linking = require('expo-linking');
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.startsWith('content://')) {
          await processIntent(initialUrl);
        }
      } catch (_) {
        // Linking not available or no intent
      }
    };

    checkInitialIntent();

    // --- Warm start: app comes to foreground with a new share ---
    let LinkingModule: any = null;
    try {
      LinkingModule = require('expo-linking');
    } catch (_) {}

    const subscription = LinkingModule?.addEventListener?.(
      'url',
      (event: { url: string }) => {
        if (event.url?.startsWith('content://') || event.url?.includes('image')) {
          processIntent(event.url);
        }
      },
    );

    return () => {
      subscription?.remove?.();
    };
  }, [processIntent]);
}

// ─── AppContent ───────────────────────────────────────────────────────────────

function AppContent() {
  const { colors, navTheme, isDark } = useTheme();
  const navigationRef = useRef<NavigationContainerRef<any> | null>(null);

  useShareIntentHandler(navigationRef);

  return (
    <NavigationContainer theme={navTheme} ref={navigationRef}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            borderTopColor: colors.tabBarBorder,
            minHeight: 62,
          },
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        }}
      >
        <Tab.Screen
          name="Home"
          component={DashboardStackNavigator}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
        />
        <Tab.Screen
          name="Activity"
          component={ActivityStackNavigator}
          options={{ tabBarIcon: ({ color, size }) => <Feather name="list" size={size} color={color} /> }}
        />
        <Tab.Screen
          name="Queue"
          component={QueueStackNavigator}
          options={{
            tabBarLabel: "Receipts",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="receipt-text-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Advisor"
          component={AIStackNavigator}
          options={{
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="creation-outline" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Invest"
          component={InvestStackNavigator}
          options={{ tabBarIcon: ({ color, size }) => <Feather name="trending-up" size={size} color={color} /> }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStackNavigator}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }}
        />
      </Tab.Navigator>
      <AppPrivacyToggle />
    </NavigationContainer>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  useEffect(() => {
    initDatabase();
    registerForPushNotificationsAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppStoreProvider>
          <ThemeProvider>
            <BiometricWrapper>
              <AppContent />
            </BiometricWrapper>
          </ThemeProvider>
        </AppStoreProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
