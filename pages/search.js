import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryStyles from '../styles/primaryStyles'; // Adjust the import path as necessary
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigation = useNavigation();

    const insets = useSafeAreaInsets();

    useEffect(() => {
        const fetchInitialFollowers = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('/user/get_followers/');
                setResults(response.data.accounts || []);
            } catch (e) {
                console.error('Error fetching initial followers:', e);
                setError('Failed to fetch initial followers');
            }
            setLoading(false);
        };

        fetchInitialFollowers();
    }, []);

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        try {
            let response;
            if (!query.trim()) {
                // Fetch followers if query is empty
                response = await axios.get('/user/get_followers/');
                setResults(response.data.accounts || []);
            } else {
                response = await axios.get('/user/search/', {
                    params: { query }
                });
                setResults(response.data.accounts || []);
            }
        } catch (e) {
            console.error('Error fetching search results:', e);
            setError('Failed to fetch results');
        }
        setLoading(false);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('FeedProfile', { username: item.username })}>
            <View>
                <Text style={styles.username}>@{item.username}</Text>
                <Text style={styles.details}>Followers: {item.num_followers} | Likes: {item.total_likes} | Posts: {item.total_posts}</Text>
            </View>
            {item.is_following && (
                <TouchableOpacity
                    style={{ justifyContent: 'center', alignItems: 'center' }}
                    onPress={async () => {
                        try {
                            await axios.post('/user/add_follower/', { username: item.username });
                            if (!query.trim()) {
                                setResults(prevResults => prevResults.map(user => user.username === item.username ? { ...user, is_following: false } : user));
                            } else {
                                setResults(prevResults => prevResults.filter(user => user.username !== item.username));
                            }
                        } catch (error) {
                            console.error('Error removing follower:', error);
                        }
                    }}
                >
                    <Text style={styles.followingLabel}>Following</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={[styles.backButton, { top: Platform.OS === 'ios' ? insets.top + 20 : 25 }]}
                 onPress={() => navigation.goBack() }>
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={[PrimaryStyles.title, { marginTop: 20, textAlign: 'center' }]}>Find Users</Text>
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.input}
                    placeholder="Search for a username"
                    placeholderTextColor="#888"
                    value={query}
                    onChangeText={setQuery}
                />
                <TouchableOpacity style={styles.button} onPress={handleSearch}>
                    <Text style={styles.buttonText}>Search</Text>
                </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator size="large" color="black" style={{ marginTop: 20 }} />}
            {error && <Text style={styles.error}>{error}</Text>}

            <FlatList
                data={results}
                keyExtractor={(item, index) => item.username + index}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={!loading && <Text style={styles.noResults}>No results</Text>}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        padding: 10,
    },
    backButton: {
        position: 'absolute',
        top: 25,
        left: 25,
        zIndex: 10,
    },
    searchBar: {
        flexDirection: 'row',
        marginBottom: 10,
        marginTop: 20, // Adjusted to avoid overlap with back button
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        height: 40,
        color: '#fff', // Adjusted text color for black background
    },
    button: {
        marginLeft: 10,
        backgroundColor: 'rgb(255, 36, 83)',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    list: {
        paddingTop: 0,
    },
    item: {
        paddingVertical: 15,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#444', // Adjusted for black background
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff', // Adjusted text color for black background
    },
    details: {
        fontSize: 14,
        marginTop: 5,
        color: '#aaa', // Subtle color for additional details
    },
    noResults: {
        textAlign: 'center',
        color: '#666',
        marginTop: 20,
    },
    error: {
        textAlign: 'center',
        color: 'red',
        marginTop: 10,
    },
    followingLabel: {
        color: 'rgb(255, 36, 83)',
        fontWeight: 'bold',
        alignSelf: 'center',
        textAlign: 'center',
        lineHeight: 20, // Match the height of the container for vertical centering
    },
});

export default Search;