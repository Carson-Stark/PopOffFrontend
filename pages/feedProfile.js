import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { logoutAction } from '../store/actions';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import PrimaryStyles from '../styles/primaryStyles';
import { ActivityIndicator } from 'react-native';
import ProfileView from './profileView';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FeedProfile = () => {
    
    const route = useRoute();
    const { username } = route.params;

    const navigation = useNavigation();

    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={styles.container}>

            <View style={[styles.overlayContainer, { top: Platform.OS === 'ios' ? insets.top : 0 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circularButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ProfileView user={username} />

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayContainer: {
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        zIndex: 1000,
        elevation: 10,
    },
    circularButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default FeedProfile;
