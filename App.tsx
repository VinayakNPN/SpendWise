import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { ExpensesScreen } from "./src/screens/ExpensesScreen";
import { AIInsightsScreen } from "./src/screens/AIInsightsScreen";
import { InvestmentsScreen } from "./src/screens/InvestmentsScreen";
import { GoalPlannerScreen } from "./src/screens/GoalPlannerScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { AppStoreProvider } from "./src/state/AppStore";
import { initDatabase } from "./src/services/database";
import { registerForPushNotificationsAsync } from "./src/services/notifications";

const Tab = createBottomTabNavigator();
const AIStack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F6F7F7",
    card: "#FFFFFF",
    text: "#1F2A2A",
    border: "#E5E7E7",
    primary: "#184B43"
  }
};

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
      <AppStoreProvider>
        <NavigationContainer theme={theme}>
          <StatusBar style="dark" />
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarHideOnKeyboard: true,
              tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#E7EBE9", height: 62, paddingBottom: 8 },
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
    </SafeAreaProvider>
  );
}
