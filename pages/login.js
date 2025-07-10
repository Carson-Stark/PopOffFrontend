import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, ScrollView, TouchableWithoutFeedback, Image } from 'react-native';
import { useState, useEffect } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useDispatch } from 'react-redux';
import { loginAction } from '../store/actions';
import PrimaryStyles from '../styles/primaryStyles';
import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import { Keyboard } from 'react-native';

const LoginScreen = () => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error_message, setError] = useState(null);

    const dispatch = useDispatch();
    const navigation = useNavigation();

    const login = async () => {

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(`/auth/login/`, { username, password });
            console.log(response.data);
            const { token } = response.data;

            if (!token) {
                setError("Network Error");
                setLoading(false);
                return;
            }

            // store token securely
            if (Platform.OS !== 'web') {
                console.log("Token stored:", token);
                await SecureStore.setItemAsync("user_token", token);
            }

            axios.defaults.headers.common['Authorization'] = `Token ${token}`;
            dispatch(loginAction({ username }));
            navigation.navigate('Inside');
        }
        catch (error) {
            console.log(error);

            user_message = error.message;
            console.log("Error message:", user_message);

            if (!error.response || error.message.includes('timeout')) {
                setError("Network Error");
                setLoading(false);
                return;
            }

            if (error.response) {
                console.log('Server responded with status', error.response.status);
                } else if (error.request) {
                console.log('No response received:', error.request);
                } else {
                console.log('Request error:', error.message);
                }

            const message = error.response.data;
            if (message['non_field_errors']) {
                user_message = message['non_field_errors'][0];
            }
            else if (message['username']) {
                user_message = "Username not specified";
            }
            else if (message['password']) {
                user_message = "Password not specified";
            }

            setError(user_message);
        }
        
        setLoading(false);
    }

    return (
        <SafeAreaView style={PrimaryStyles.screen_container}>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
                >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                    contentContainerStyle={PrimaryStyles.centered_stack}
                    keyboardShouldPersistTaps="handled"
                    >
                    <Image
                        source={require('../assets/logo.png')}
                        resizeMode="contain"
                        style={{
                        marginBottom: 40,
                        height: 100,
                        width: 300,
                        alignSelf: 'center',
                        }}
                    />
                    <TextInput
                        placeholder='Username'
                        value={username}
                        style={PrimaryStyles.input}
                        onChangeText={text => setUsername(text)}
                    />
                    <TextInput
                        placeholder='Password'
                        value={password}
                        style={PrimaryStyles.input}
                        secureTextEntry
                        onChangeText={text => setPassword(text)}
                    />
                    {error_message && <Text style={PrimaryStyles.error}>{error_message}</Text>}
                    <TouchableOpacity
                        onPress={login}
                        disabled={loading}
                        style={PrimaryStyles.button}
                    >
                        {loading ? (
                        <ActivityIndicator size="large" color="white" style={{ margin: 10 }} />
                        ) : (
                        <Text style={PrimaryStyles.button_text}>Login</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('CreateAccount')} disabled={loading}>
                        <Text style={PrimaryStyles.button_text}>Create Account</Text>
                    </TouchableOpacity>
                    </ScrollView>
                </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

export default LoginScreen;

