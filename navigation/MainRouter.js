import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from "../pages/login";
import RegisterScreen from "../pages/createAccount";
import InsideNavigator from "./InsideNavigator";
import SplashScreen from "../pages/splash";

const Stack = createStackNavigator();

const MainRouter = () => {

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="CreateAccount" component={RegisterScreen} />
                <Stack.Screen name="Inside" component={InsideNavigator} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default MainRouter;