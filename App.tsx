import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DashboardScreen } from "./src/screens/DashboardScreen";
import { ExpensesScreen } from "./src/screens/ExpensesScreen";
import { AIInsightsScreen } from "./src/screens/AIInsightsScreen";
import { InvestmentsScreen } from "./src/screens/InvestmentsScreen";
import { GoalPlannerScreen } from "./src/screens/GoalPlannerScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { AppStoreProvider } from "./src/state/AppStore";
import { initDatabase } from "./src/services/database";
import { registerForPushNotificationsAsync } from "./src/services/notifications";
import { AppTheme } from "./src/utils/theme";

const Tab = createBottomTabNavigator();
const AIStack = createNativeStackNavigator();
const queryClient = new QueryClient();

function AIStackNavigator() {
  return (
    <AIStack.Navigator screenOptions={{ headerShown: false }}>
      <AIStack.Screen name="AIHome" component={AIInsightsScreen} />
      <AIStack.Screen name="Goals" component={GoalPlannerScreen} />
    </AIStack.Navigator>
  );
}

export default function App() {
  React.useEffect(() => {
    initDatabase();
    registerForPushNotificationsAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppStoreProvider>
          <NavigationContainer theme={AppTheme}>
            <StatusBar style="dark" />
            <Tab.Navigator
              screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#E7EBE9", minHeight: 62 },
                tabBarActiveTintColor: "#184B43",
                tabBarInactiveTintColor: "#94A3A0",
                tabBarLabelStyle: { fontSize: 11, fontWeight: "600" }
              }}
            >
              <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
              />
              <Tab.Screen
                name="Expenses"
                component={ExpensesScreen}
                options={{ tabBarIcon: ({ color, size }) => <Feather name="list" size={size} color={color} /> }}
              />
              <Tab.Screen
                name="AI Coach"
                component={AIStackNavigator}
                options={{
                  tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="creation-outline" size={size} color={color} />
                }}
              />
              <Tab.Screen
                name="Invest"
                component={InvestmentsScreen}
                options={{ tabBarIcon: ({ color, size }) => <Feather name="trending-up" size={size} color={color} /> }}
              />
              <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </AppStoreProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
