import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { logoutAction } from '../store/actions';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import PrimaryStyles from '../styles/primaryStyles';

const AccountSettings = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const handleLogout = async () => {
        try {
            navigation.navigate('Login');
            const response = await axios.get(`/auth/logout/`, {});
            axios.defaults.headers.common['Authorization'] = null;
            await SecureStore.deleteItemAsync("user_token");
            dispatch(logoutAction());
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const handleDeleteData = async () => {
        Alert.alert(
            "Confirm Reset",
            "Are you sure you want to reset your engagement data? All your comments, likes, and view history will be deleted. This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "OK",
                    onPress: async () => {
                        try {
                            const response = await axios.post(`/user/reset_user_engagement/`); // No body sent
                            console.log("Data deleted successfully:", response.data);
                            Alert.alert("Success", "Data deleted successfully");
                        } catch (error) {
                            console.error("Error deleting data:", error, error?.response, error?.request);
                            Alert.alert("Error", "There was a problem resetting your data. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = async () => {

        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete your account? All your content and data will be deleted immediately. This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "OK",
                    onPress: async () => {
                        try {
                            const response = await axios.delete(`/user/delete_account/`);
                            console.log("Account deleted successfully:", response.data);
                            // clear token and navigate to login
                            axios.defaults.headers.common['Authorization'] = null;
                            await SecureStore.deleteItemAsync("user_token");
                            dispatch(logoutAction());
                            navigation.navigate('Login');
                            Alert.alert("Success", "Account deleted successfully");
                        } catch (error) {
                            console.error("Error deleting account:", error);
                            Alert.alert("Error", "There was a problem deleting your account. Please try again.");
                        }
                    }
                }
            ]
        );

    }


    const handleViewPreferences = () => {
        navigation.navigate('UserPreferences');
    };

    return (
        <SafeAreaView style={[PrimaryStyles.screen_container, styles.centeredContent]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={PrimaryStyles.secondary_button} onPress={handleViewPreferences}>
                <Text style={PrimaryStyles.secondary_button_text}>View Preferences</Text>
            </TouchableOpacity>
            <TouchableOpacity style={PrimaryStyles.secondary_button} onPress={handleDeleteData}>
                <Text style={PrimaryStyles.secondary_button_text}>Reset Engagement Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={PrimaryStyles.secondary_button} onPress={handleDeleteAccount}>
                <Text style={PrimaryStyles.secondary_button_text}>Delete Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={PrimaryStyles.button} onPress={handleLogout}>
                <Text style={PrimaryStyles.button_text}>Logout</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredContent: {
        justifyContent: 'center',
    },
});

export default AccountSettings;
