import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView } from 'react-native';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { logoutAction } from '../store/actions';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import PrimaryStyles from '../styles/primaryStyles';
import { ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

const thumbnailWidth = Platform.OS === 'ios' ? (Dimensions.get('window').width - 20 - 6) / 3 : (Dimensions.get('window').width - 40 - 6) / 3;

const ProfileView = ({ user }) => {
    const [posts, setPosts] = useState([]);
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const [username, setUsername] = useState(user);
    const [total_likes, setTotalLikes] = useState(0);
    const [total_followers, setTotalFollowers] = useState(0);
    const [total_posts, setTotalPosts] = useState(0);
    const [is_following, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            fetchImages();
        }, [])
    );

    const fetchImages = async () => {
        setLoading(true);

        setUsername(user);

        try {
            console.log("Fetching images for user:", user); 
            const response = await axios.get(`/media/get_user_posts/`, { params: { username: user } });
            if (user == "")
                setUsername(response.data.username);
            setTotalLikes(response.data.total_likes);
            setTotalFollowers(response.data.total_followers);
            setTotalPosts(response.data.posts.length);
            setIsFollowing(response.data.is_following);
            setPosts(response.data.posts);
            console.log(response.data.username);
        } catch (error) {
            console.error("Error fetching images:", error);
       }

        setLoading(false);
    };

    const handleFollow = async () => {
        try {
            const response = await axios.post('/user/add_follower/', { username: user });
            console.log('Follow response:', response.data);
            if (is_following) {
                setIsFollowing(false);
                setTotalFollowers(prev => prev - 1);
            }
            else {
                setIsFollowing(true);
                setTotalFollowers(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error following user:', error);
        }
    };

    const formatViews = (views) => {
        if (views >= 1_000_000) {
            return (views / 1_000_000).toFixed(1) + 'm';
        } else if (views >= 1_000) {
            return (views / 1_000).toFixed(1) + 'k';
        }
        return views.toString();
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('Post', { post: item })}>
            <View style={{ position: 'relative' }}>
                <Image source={{ uri: item.thumbnail_link }} style={styles.image} />
                <View style={styles.overlay}>
                    <Ionicons name="play" size={14} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.viewsText}>{formatViews(item.views)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.username}>{"@" + username}</Text>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{total_followers}</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{total_likes}</Text>
                    <Text style={styles.statLabel}>Likes</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{total_posts}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                </View>
            </View>

            {user != "" && (
                is_following ? (
                    <TouchableOpacity onPress={handleFollow} style={[styles.followButton, { backgroundColor: 'gray' }]}>
                        <Text style={styles.followButtonText}>Following</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleFollow} style={styles.followButton}>
                        <Text style={styles.followButtonText}>Follow</Text>
                    </TouchableOpacity>
                )
            )}

            {loading && posts.length === 0 ? (
                // Show ActivityIndicator when loading and posts are empty
                <ActivityIndicator size="large" color="black" style={styles.loadingIndicator} />
            ) : (
                posts.length === 0 ? (
                    //show no posts message when posts are empty
                    <Text style={[styles.likes, { marginTop: 40 }]}>No posts yet</Text>
                ) : (

                    <View style={styles.posts_container}>
                        <FlatList
                            data={posts}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={3}
                            contentContainerStyle={styles.grid}
                        />
                    </View>
                )
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    username: {
        fontSize: 25,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 5,
    },
    likes: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    posts_container: {
        flex: 1,
        width: '100%',
        alignContent: 'flex-start',
        marginTop: 10,
    }, 
    grid: {
        justifyContent: 'space-between',
    },
    image: {
        width: thumbnailWidth, // Adjusted to account for margins
        height: thumbnailWidth, // Adjusted to maintain aspect ratio
        margin: 1,
        borderColor: '#ccc',
        borderWidth: 0,
    },
    loadingIndicator: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewsText: {
        color: '#fff',
        fontSize: 12,
    },
    container: {
        flex: 1,
        padding: 10,
        width: '100%',
        alignItems: 'center',
    },
    followButton: {
        backgroundColor: 'rgb(255, 36, 83)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginVertical: 10,
    },
    followButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '80%',
        marginVertical: 15
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    statLabel: {
        fontSize: 14,
        color: 'white',
    },
});

export default ProfileView;
