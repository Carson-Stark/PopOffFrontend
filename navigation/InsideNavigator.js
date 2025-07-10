import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import Feed from "../pages/feed";
import ProfilePage from "../pages/profilePage";
import CreateScreen from "../pages/create";
import PostPage from "../pages/post";
import SearchPage from "../pages/search";
import FeedProfile from "../pages/feedProfile";
import AccountSettings from "../pages/accountSettings";
import UserPreferences from "../pages/userPreferences";

// Create Tab Navigator
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfilePage" component={ProfilePage} />
      <Stack.Screen name="AccountSettings" component={AccountSettings} />
      <Stack.Screen name="UserPreferences" component={UserPreferences} />
      <Stack.Screen name="Post" component={PostPage} />
    </Stack.Navigator>
  );
};

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Feed" component={Feed} />
      <Stack.Screen name="FeedProfile" component={FeedProfile} />
      <Stack.Screen name="Post" component={PostPage} />
      <Stack.Screen name="Search" component={SearchPage} />
    </Stack.Navigator>
  );
};

export default function InsideNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Create") {
            iconName = "add-circle";
          } else if (route.name === "Profile") {
            iconName = "person";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "black",
          elevation: 0,
          shadowOpacity: 0,
          borderTopWidth: 0,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
});
