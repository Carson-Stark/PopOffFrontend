import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, Image, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginAction } from '../store/actions';
import PrimaryStyles from '../styles/primaryStyles';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { AxiosError } from 'axios';

const SplashScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const [error, setError] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(false);

    const checkFirstTime = async () => {
            try {
                const firstTimeFlag = await SecureStore.getItemAsync("first_time_user");

                if (!firstTimeFlag) {
                    setIsFirstTime(true);
                    await SecureStore.setItemAsync("first_time_user", "true");
                }
            } catch (error) {
                console.error("Error checking first time user flag:", error);
            }
        };

    const checkToken = async () => {
        try {
            const token = await SecureStore.getItemAsync("user_token");
            if (token) {
                console.log("Token found:", token);

                axios.defaults.headers.common['Authorization'] = `Token ${token}`;

                // Check if token is valid
                const response = await axios.get(`/auth/check_token/`);
                console.log(response.data.username);

                dispatch(loginAction({ username: response.data.username }));
                navigation.navigate('Inside');
            } else {
                console.log("No token found");
                navigation.navigate('Login');
            }
        } catch (error) {
            console.error("Error checking token:", error);

            // 2️⃣  Message + stack (generic Error objects);
            console.error('❌ message :', error.message);          // “Network Error”
            console.error('📜 code    :', error.code);             // e.g. ERR_NETWORK
            console.error('📡 config  :', error.config.url);       // full URL Axios used

            // 3️⃣  Axios / fetch details
            const axiosErr = error;
            if (axiosErr?.response) {
                console.error('🚦 status   ➜', axiosErr.response.status);
                console.error('🪂 headers  ➜', axiosErr.response.headers);
                console.error('📦 payload  ➜', axiosErr.response.data);
            }

            // If token is invalid, delete it
            if (error.response && error.response.status === 401) {
                console.log("Token invalid");
                await SecureStore.deleteItemAsync("user_token");
                axios.defaults.headers.common['Authorization'] = null;
            }

            if (!error.response || error.message.includes('timeout')) {
                setError(true);
                return;
            }

            navigation.navigate('Login');
        }
    };

    useEffect(() => {

        const initializeApp = async () => {
            await checkFirstTime();
            checkToken();
        };

        initializeApp();
    }, []);

    useEffect(() => {
        if (isFirstTime) {
            Alert.alert(
                "Alert",
                "This app was made in 24 hours! It is obviously missing features lol. Expect bugs. Your experience will be subpar. With that being said, we are updating frequently. Have fun!",
                [{ text: "I Accept" }]
            );
        }
    }, [isFirstTime]);

    return (
        <View style={PrimaryStyles.centered_screen}>
            {error ? (
            <>
                <Text style={PrimaryStyles.title}>Can't Reach Server. Check Connection.</Text>
                <TouchableOpacity onPress={() => checkToken()} style={PrimaryStyles.secondary_button}>
                    <Text style={PrimaryStyles.secondary_button_text}>Retry</Text>
                </TouchableOpacity>
            </>
            ) : (
                <Image
                    source={require('../assets/logo.png')}
                    resizeMode="contain"
                    style={{ width: "80%", paddingBottom: "50%" }}
                />
            )}
        </View>
    );
};

export default SplashScreen;
