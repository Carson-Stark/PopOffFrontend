import React, { useEffect, useState, useRef } from "react";
import { View, TouchableOpacity, Alert, StyleSheet, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import PrimaryStyles from '../styles/primaryStyles';
import VideoItem from './video';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PostPage = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { post } = route.params;
    const username = useSelector(state => state.username);
    const hasNavigatedBack = useRef(false);

    const isFocused = useIsFocused();

    const topPadding = useSafeAreaInsets().top || 0; // Get top padding for safe area

    useEffect(() => {
        if (!isFocused && !hasNavigatedBack.current) {
            hasNavigatedBack.current = true;
            navigation.goBack();
        }
    }, [isFocused]);

    const back_button = () => {
        if (!hasNavigatedBack.current) {
            hasNavigatedBack.current = true;
            navigation.goBack();
        }
    }

    const deletePost = async () => {
        try {
            const response = await axios.delete(`/media/delete_post/`, { data: { video_id: post.id } });
            console.log(response.data);
            Alert.alert('Success', 'Post deleted successfully!');
            back_button();
        } catch (error) {
            console.error("Error deleting post:", error);
            Alert.alert('Error', 'Failed to delete post.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <VideoItem item={post} isActive={true} style={styles.video} />
            <View style={[styles.overlayContainer, { top: topPadding }]}>
                <TouchableOpacity onPress={() => back_button()} style={styles.circularButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                {post.user === username &&
                    <TouchableOpacity onPress={deletePost} style={styles.circularButton}>
                        <Ionicons name="trash" size={24} color="white" />
                    </TouchableOpacity>
                }
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "black"
    },
    video: {
        width: '100%',
        height: '100%',
    },
    overlayContainer: {
        position: 'absolute',
        top: "5%",
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
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

export default PostPage;
