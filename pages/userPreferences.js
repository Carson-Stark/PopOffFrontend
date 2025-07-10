import React, { use, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, Platform } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PrimaryStyles from '../styles/primaryStyles';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const responsiveFontSize = width * 0.038; // Adjust the multiplier as needed

const UserPreferences = () => {
    const [preferences, setPreferences] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    const topPadding = useSafeAreaInsets().top || 0; // Get top padding for safe area

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const response = await axios.get('user/get_preferences/');
                const sortedPreferences = Object.entries(response.data)
                    .sort((a, b) => b[1] - a[1]); // Sort by percentage in descending order
                setPreferences(sortedPreferences);
            } catch (error) {
                console.error("Error fetching preferences:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPreferences();
    }, []);

    const renderItem = ({ item }) => {
        const cleanedText = item[0].replace(/\s*\(.*?\)\s*/g, ''); // Remove text inside parentheses
        return (
            <View style={styles.itemContainer}>
                <Text style={styles.itemText}>{cleanedText}</Text>
                <Text style={styles.itemPercentage}>{(item[1] * 100).toFixed(1)}%</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="white" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={[styles.backButton, {top: topPadding} ]} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={[PrimaryStyles.title, styles.titlePadding]}>User Preferences</Text>
            <FlatList
                data={preferences}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        padding: 20,
        paddingTop: 35, // Adjust for status bar
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: "5%", // Adjust for iOS status bar
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding:10,
        borderBottomWidth: 1,
        borderBottomColor: 'gray',
    },
    itemText: {
        color: 'white',
        fontSize: responsiveFontSize,
        paddingRight: 10,
    },
    itemPercentage: {
        color: 'white',
        fontSize: responsiveFontSize,
    },
    titlePadding: {
        marginTop: 10,
    },
});

export default UserPreferences;
